const DIFF_EQUAL = 0,
    DIFF_INSERT = 1,
    DIFF_DELETE = -1

type DiffTuple = [number, string]

export class DiffMatchPatch {
    public diffTimeout: number = 1.0
    public diffEditCost: number = 4
    public matchThreshold: number = 0.5
    public matchDistance: number = 1000
    public matchMaxBits: number = 32
    public patchDeleteThreshold: number = 0.5
    public patchMargin: number = 4
    public nonAlphaNumericRegex: RegExp = /[^a-zA-Z0-9]/
    public whitespaceRegex: RegExp = /\s/
    public lineBreakRegex: RegExp = /[\r\n]/
    public blankLineEndRegex: RegExp = /\n\r?\n$/
    public blankLineStartRegex: RegExp = /^\r?\n\r?\n/

    constructor() {}

    public main(text1: string, text2: string, optDeadline?: number, optCheckLines?: boolean): DiffTuple[] {
        if (typeof optDeadline === 'undefined') {
            if (this.diffTimeout <= 0) {
                optDeadline = Number.MAX_VALUE
            } else {
                optDeadline = new Date().getTime() + this.diffTimeout * 1000
            }
        }

        const deadline = optDeadline

        if (text1 === text2) return [new Diff(DIFF_EQUAL, text1).toArray()]

        if (typeof optCheckLines === 'undefined') {
            optCheckLines = true
        }

        const checkLines = optCheckLines

        let commonLength = this.commonPrefix(text1, text2),
            commonPrefix = text1.substring(0, commonLength)
        text1 = text1.substring(commonLength)
        text2 = text2.substring(commonLength)

        commonLength = this.commonSuffix(text1, text2)
        let commonSuffix = text1.substring(text1.length - commonLength)
        text1 = text1.substring(0, text1.length - commonLength)
        text2 = text2.substring(0, text2.length - commonLength)

        // Compute the diff on the middle block.
        const diffs: DiffTuple[] = this.compute(text1, text2, deadline, checkLines)

        // Restore the prefix and suffix.
        if (commonPrefix) {
            diffs.unshift(new Diff(DIFF_EQUAL, commonPrefix).toArray())
        }
        if (commonSuffix) {
            diffs.push(new Diff(DIFF_EQUAL, commonSuffix).toArray())
        }

        this.cleanupMerge(diffs)

        return diffs
    }

    public commonPrefix(text1: string, text2: string) {
        if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
            return 0
        }

        let pointerMin = 0,
            pointerMax = Math.min(text1.length, text2.length),
            pointerMid = pointerMax,
            pointerStart = 0

        while (pointerMin < pointerMid) {
            if (text1.substring(pointerStart, pointerMid) === text2.substring(pointerStart, pointerMid)) {
                pointerMin = pointerMid
                pointerStart = pointerMin
            } else {
                pointerMax = pointerMid
            }
            pointerMid = Math.floor((pointerMax - pointerMin) / 2 + pointerMin)
        }

        return pointerMid
    }

    public commonSuffix(text1: string, text2: string) {
        if (!text1 || !text2 || text1.charAt(text1.length - 1) !== text2.charAt(text2.length - 1)) {
            return 0
        }

        let pointerMin = 0,
            pointerMax = Math.min(text1.length, text2.length),
            pointerMid = pointerMax,
            pointerEnd = 0

        while (pointerMin < pointerMid) {
            if (
                text1.substring(text1.length - pointerMid, text1.length - pointerEnd) ===
                text2.substring(text2.length - pointerMid, text2.length - pointerEnd)
            ) {
                pointerMin = pointerMid
                pointerEnd = pointerMin
            } else {
                pointerMax = pointerMid
            }
            pointerMid = Math.floor((pointerMax - pointerMin) / 2 + pointerMin)
        }

        return pointerMid
    }

    public compute(text1: string, text2: string, deadline: number, checkLines: boolean): DiffTuple[] {
        let diffs: DiffTuple[] = []

        // Just add some text (speedup).
        if (!text1) return [new Diff(DIFF_INSERT, text2).toArray()]
        // Just delete some text (speedup).
        if (!text2) return [new Diff(DIFF_DELETE, text1).toArray()]

        const longText = text1.length > text2.length ? text1 : text2,
            shortText = text1.length > text2.length ? text2 : text1,
            index = longText.indexOf(shortText)

        if (index !== -1) {
            // Shorter text is inside the longer text (speedup).
            diffs = [
                new Diff(DIFF_INSERT, longText.substring(0, index)).toArray(),
                new Diff(DIFF_EQUAL, shortText).toArray(),
                new Diff(DIFF_INSERT, longText.substring(index + shortText.length)).toArray()
            ]

            // Swap insertions for deletions if diff is reversed.
            if (text1.length > text2.length) {
                diffs[0]![0] = DIFF_DELETE
                diffs[2]![0] = DIFF_DELETE
            }

            return diffs
        }

        if (shortText.length === 1) {
            // Single character string.
            // After the previous speedup, the character can't be an equality.
            return [new Diff(DIFF_DELETE, text1).toArray(), new Diff(DIFF_INSERT, text2).toArray()]
        }

        // Check to see if the problem can be split in two.
        const halfMatch = this.halfMatch(text1, text2)

        if (halfMatch) {
            // A half-match was found, sort out the return data.
            let text1A = halfMatch[0]!,
                text1B = halfMatch[1]!,
                text2A = halfMatch[2]!,
                text2B = halfMatch[3]!,
                midCommon = halfMatch[4]!

            // Send both pairs off for separate processing.
            const diffsA: DiffTuple[] = this.main(text1A, text2A, deadline, checkLines),
                diffsB: DiffTuple[] = this.main(text1B, text2B, deadline, checkLines)

            // Merge the results.
            return diffsA.concat([new Diff(DIFF_EQUAL, midCommon).toArray()], diffsB)
        }

        if (checkLines && text1.length > 100 && text2.length > 100) {
            return this.lineMode(text1, text2, deadline)
        }

        return this.bisect(text1, text2, deadline)
    }

    public halfMatch(text1: string, text2: string): string[] | null {
        // Don't risk returning a non-optimal diff if we have unlimited time.
        if (this.diffTimeout <= 0) return null

        const longText = text1.length > text2.length ? text1 : text2,
            shortText = text1.length > text2.length ? text2 : text1

        if (longText.length < 4 || shortText.length * 2 < longText.length) {
            return null // Pointless.
        }

        /**
         * Does a substring of shortText exist within longText such that the substring
         * is at least half the length of longText?
         * Closure, but does not reference any external variables.
         * @param longText Longer string.
         * @param shortText Shorter string.
         * @param index Start index of quarter length substring within longText.
         * @returns Five element Array, containing the prefix of
         *     longText, the suffix of longText, the prefix of shortText, the suffix
         *     of shortText and the common middle.  Or null if there was no match.
         */
        const halfMatchIndex = (longText: string, shortText: string, index: number): string[] | null => {
            // Start with a 1/4 length substring at position i as a seed.
            const seed = longText.substring(index, index + Math.floor(longText.length / 4))
            let bestCommon = '',
                bestLongTextA = '',
                bestLongTextB = '',
                bestShortTextA = '',
                bestShortTextB = ''

            let j = -1

            while ((j = shortText.indexOf(seed, j + 1)) !== -1) {
                const prefixLength = this.commonPrefix(longText.substring(index), shortText.substring(j))
                const suffixLength = this.commonSuffix(longText.substring(0, index), shortText.substring(0, j))

                if (bestCommon.length < suffixLength + prefixLength) {
                    bestCommon = shortText.substring(j - suffixLength, j) + shortText.substring(j, j + prefixLength)
                    bestLongTextA = longText.substring(0, index - suffixLength)
                    bestLongTextB = longText.substring(index + prefixLength)
                    bestShortTextA = shortText.substring(0, j - suffixLength)
                    bestShortTextB = shortText.substring(j + prefixLength)
                }
            }

            if (bestCommon.length * 2 >= longText.length) {
                return [bestLongTextA, bestLongTextB, bestShortTextA, bestShortTextB, bestCommon]
            } else {
                return null
            }
        }

        const halfMatch1 = halfMatchIndex(longText, shortText, Math.ceil(longText.length / 4)),
            halfMatch2 = halfMatchIndex(longText, shortText, Math.ceil(longText.length / 2))

        let halfMatch: string[]

        if (!halfMatch1 && !halfMatch2) {
            return null
        } else if (!halfMatch2) {
            halfMatch = halfMatch1!
        } else if (!halfMatch1) {
            halfMatch = halfMatch2
        } else {
            // Both matched. Select the longest.
            halfMatch = halfMatch1[4]!.length > halfMatch2[4]!.length ? halfMatch1 : halfMatch2
        }

        // A half-match was found, sort out the return data.
        let text1A: string, text1B: string, text2A: string, text2B: string

        if (text1.length > text2.length) {
            text1A = halfMatch[0]!
            text1B = halfMatch[1]!
            text2A = halfMatch[2]!
            text2B = halfMatch[3]!
        } else {
            text2A = halfMatch[0]!
            text2B = halfMatch[1]!
            text1A = halfMatch[2]!
            text1B = halfMatch[3]!
        }

        const midCommon = halfMatch[4]!

        return [text1A, text1B, text2A, text2B, midCommon]
    }

    public lineMode(text1: string, text2: string, deadline: number): DiffTuple[] {
        // Scan the text on a line-by-line basis first.
        const a = this.linesToChars(text1, text2)
        text1 = a.chars1
        text2 = a.chars2
        const lineArray = a.lineArray
        const diffs: DiffTuple[] = this.main(text1, text2, deadline, false)

        // Convert the diff back to original text.
        this.charsToLines(diffs, lineArray)
        // Eliminate freak matches (e.g. blank lines)
        this.cleanupSemantic(diffs)

        // Rediff any replacement blocks, this time character-by-character.
        // Add a dummy entry at the end.
        diffs.push(new Diff(DIFF_EQUAL, '').toArray())

        let pointer = 0,
            count_delete = 0,
            count_insert = 0,
            text_delete = '',
            text_insert = ''

        while (pointer < diffs.length) {
            switch (diffs[pointer]![0]) {
                case DIFF_INSERT:
                    count_insert++
                    text_insert += diffs[pointer]![1]
                    break
                case DIFF_DELETE:
                    count_delete++
                    text_delete += diffs[pointer]![1]
                    break
                case DIFF_EQUAL:
                    // Upon reaching an equality, check for prior redundancies.
                    if (count_delete >= 1 && count_insert >= 1) {
                        // Delete the offending records and add the merged ones.
                        diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert)
                        pointer = pointer - count_delete - count_insert
                        const subDiff = this.main(text_delete, text_insert, deadline, false)

                        for (let j = subDiff.length - 1; j >= 0; j--) {
                            diffs.splice(pointer, 0, subDiff[j]!)
                        }

                        pointer = pointer + subDiff.length
                    }

                    count_insert = 0
                    count_delete = 0
                    text_delete = ''
                    text_insert = ''
                    break
            }

            pointer++
        }

        diffs.pop() // Remove the dummy entry at the end.

        return diffs
    }

    public linesToChars(text1: string, text2: string) {
        const lineArray: string[] = [], // e.g. lineArray[4] === 'Hello\n'
            lineHash: Record<string, number> = {} // e.g. lineHash['Hello\n'] === 4

        // '\x00' is a valid character, but various debuggers don't like it.
        // So we'll insert a junk entry to avoid generating a null character.
        lineArray[0] = ''

        /**
         * Split a text into an array of strings. Reduce the texts to a string of
         * hashes where each Unicode character represents one line.
         * Modifies lineArray and lineHash through being a closure.
         * @param text String to encode.
         * @returns Encoded string.
         */
        function linesToCharsMunge(text: string): string {
            let chars = '',
                // Walk the text, pulling out a substring for each line.
                // text.split('\n') would would temporarily double our memory footprint.
                // Modifying text would create many large strings to garbage collect.
                lineStart = 0,
                lineEnd = -1,
                // Keeping our own length variable is faster than looking it up.
                lineArrayLength = lineArray.length

            while (lineEnd < text.length - 1) {
                lineEnd = text.indexOf('\n', lineStart)
                if (lineEnd === -1) {
                    lineEnd = text.length - 1
                }

                let line = text.substring(lineStart, lineEnd + 1)

                if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) : lineHash[line] !== undefined) {
                    chars += String.fromCharCode(lineHash[line]!)
                } else {
                    if (lineArrayLength === maxLines) {
                        // Bail out at 65535 because
                        // String.fromCharCode(65536) === String.fromCharCode(0)
                        line = text.substring(lineStart)
                        lineEnd = text.length
                    }

                    chars += String.fromCharCode(lineArrayLength)
                    lineHash[line] = lineArrayLength
                    lineArray[lineArrayLength++] = line
                }

                lineStart = lineEnd + 1
            }

            return chars
        }

        // Allocate 2/3rds of the space for text1, the rest for text2.
        let maxLines = 40000
        const chars1 = linesToCharsMunge(text1)
        maxLines = 65535
        const chars2 = linesToCharsMunge(text2)

        return { chars1: chars1, chars2: chars2, lineArray: lineArray }
    }

    public charsToLines(diffs: DiffTuple[], lineArray: string[]) {
        for (let i = 0; i < diffs.length; i++) {
            const chars = diffs[i]![1]
            const text: string[] = []

            for (let j = 0; j < chars.length; j++) {
                text[j] = lineArray[chars.charCodeAt(j)]!
            }

            diffs[i]![1] = text.join('')
        }
    }

    public cleanupSemantic(diffs: DiffTuple[]) {
        let changes = false
        const equalities: number[] = [] // Stack of indices where equalities are found.
        let equalitiesLength = 0 // Keeping our own length var is faster in JS.
        let lastEquality: string | null = null
        // Always equal to diffs[equalities[equalitiesLength - 1]][1]
        let pointer = 0 // Index of current position.
        // Number of characters that changed prior to the equality.
        let lengthInsertions1 = 0,
            lengthDeletions1 = 0,
            // Number of characters that changed after the equality.
            lengthInsertions2 = 0,
            lengthDeletions2 = 0

        while (pointer < diffs.length) {
            if (diffs[pointer]![0] === DIFF_EQUAL) {
                // Equality found.
                equalities[equalitiesLength++] = pointer
                lengthInsertions1 = lengthInsertions2
                lengthDeletions1 = lengthDeletions2
                lengthInsertions2 = 0
                lengthDeletions2 = 0
                lastEquality = diffs[pointer]![1]
            } else {
                // An insertion or deletion.
                if (diffs[pointer]![0] === DIFF_INSERT) {
                    lengthInsertions2 += diffs[pointer]![1].length
                } else {
                    lengthDeletions2 += diffs[pointer]![1].length
                }
                // Eliminate an equality that is smaller or equal to the edits on both
                // sides of it.
                if (
                    lastEquality &&
                    lastEquality.length <= Math.max(lengthInsertions1, lengthDeletions1) &&
                    lastEquality.length <= Math.max(lengthInsertions2, lengthDeletions2)
                ) {
                    // Duplicate record.
                    diffs.splice(equalities[equalitiesLength - 1]!, 0, new Diff(DIFF_DELETE, lastEquality).toArray())
                    // Change second copy to insert.
                    diffs[equalities[equalitiesLength - 1]! + 1]![0] = DIFF_INSERT
                    // Throw away the equality we just deleted.
                    equalitiesLength--
                    // Throw away the previous equality (it needs to be reevaluated).
                    equalitiesLength--
                    pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1]! : -1
                    lengthInsertions1 = 0 // Reset the counters.
                    lengthDeletions1 = 0
                    lengthInsertions2 = 0
                    lengthDeletions2 = 0
                    lastEquality = null
                    changes = true
                }
            }

            pointer++
        }

        // Normalize the diff.
        if (changes) {
            this.cleanupMerge(diffs)
        }

        this.cleanupSemanticLossless(diffs)

        // Find any overlaps between deletions and insertions.
        // Only extract an overlap if it is as big as the edit ahead or behind it.
        pointer = 1
        while (pointer < diffs.length) {
            if (diffs[pointer - 1]![0] === DIFF_DELETE && diffs[pointer]![0] === DIFF_INSERT) {
                let deletion = diffs[pointer - 1]![1],
                    insertion = diffs[pointer]![1],
                    overlapLength1 = this.commonOverlap(deletion, insertion),
                    overlapLength2 = this.commonOverlap(insertion, deletion)

                if (overlapLength1 >= overlapLength2) {
                    if (overlapLength1 >= deletion.length / 2 || overlapLength1 >= insertion.length / 2) {
                        // Overlap found.  Insert an equality and trim the surrounding edits.
                        diffs.splice(pointer, 0, new Diff(DIFF_EQUAL, insertion.substring(0, overlapLength1)).toArray())
                        diffs[pointer - 1]![1] = deletion.substring(0, deletion.length - overlapLength1)
                        diffs[pointer + 1]![1] = insertion.substring(overlapLength1)
                        pointer++
                    }
                } else {
                    if (overlapLength2 >= deletion.length / 2 || overlapLength2 >= insertion.length / 2) {
                        // Reverse overlap found.
                        // Insert an equality and swap and trim the surrounding edits.
                        diffs.splice(pointer, 0, new Diff(DIFF_EQUAL, deletion.substring(0, overlapLength2)).toArray())
                        diffs[pointer - 1]![0] = DIFF_INSERT
                        diffs[pointer - 1]![1] = insertion.substring(0, insertion.length - overlapLength2)
                        diffs[pointer + 1]![0] = DIFF_DELETE
                        diffs[pointer + 1]![1] = deletion.substring(overlapLength2)
                        pointer++
                    }
                }

                pointer++
            }

            pointer++
        }
    }

    public cleanupMerge(diffs: DiffTuple[]) {
        // Add a dummy entry at the end.
        diffs.push(new Diff(DIFF_EQUAL, '').toArray())

        let pointer = 0,
            countDelete = 0,
            countInsert = 0,
            textDelete = '',
            textInsert = '',
            commonLength: number

        while (pointer < diffs.length) {
            switch (diffs[pointer]![0]) {
                case DIFF_INSERT:
                    countInsert++
                    textInsert += diffs[pointer]![1]
                    pointer++
                    break
                case DIFF_DELETE:
                    countDelete++
                    textDelete += diffs[pointer]![1]
                    pointer++
                    break
                case DIFF_EQUAL:
                    // Upon reaching an equality, check for prior redundancies.
                    if (countDelete + countInsert > 1) {
                        if (countDelete !== 0 && countInsert !== 0) {
                            // Factor out any common prefixies.
                            commonLength = this.commonPrefix(textInsert, textDelete)

                            if (commonLength !== 0) {
                                if (
                                    pointer - countDelete - countInsert > 0 &&
                                    diffs[pointer - countDelete - countInsert - 1]![0] === DIFF_EQUAL
                                ) {
                                    diffs[pointer - countDelete - countInsert - 1]![1] += textInsert.substring(
                                        0,
                                        commonLength
                                    )
                                } else {
                                    diffs.splice(
                                        0,
                                        0,
                                        new Diff(DIFF_EQUAL, textInsert.substring(0, commonLength)).toArray()
                                    )
                                    pointer++
                                }
                                textInsert = textInsert.substring(commonLength)
                                textDelete = textDelete.substring(commonLength)
                            }

                            // Factor out any common suffixies.
                            commonLength = this.commonSuffix(textInsert, textDelete)
                            if (commonLength !== 0) {
                                diffs[pointer]![1] =
                                    textInsert.substring(textInsert.length - commonLength) + diffs[pointer]![1]
                                textInsert = textInsert.substring(0, textInsert.length - commonLength)
                                textDelete = textDelete.substring(0, textDelete.length - commonLength)
                            }
                        }
                        // Delete the offending records and add the merged ones.
                        pointer -= countDelete + countInsert
                        diffs.splice(pointer, countDelete + countInsert)

                        if (textDelete.length) {
                            diffs.splice(pointer, 0, new Diff(DIFF_DELETE, textDelete).toArray())
                            pointer++
                        }

                        if (textInsert.length) {
                            diffs.splice(pointer, 0, new Diff(DIFF_INSERT, textInsert).toArray())
                            pointer++
                        }

                        pointer++
                    } else if (pointer !== 0 && diffs[pointer - 1]![0] === DIFF_EQUAL) {
                        // Merge this equality with the previous one.
                        diffs[pointer - 1]![1] += diffs[pointer]![1]
                        diffs.splice(pointer, 1)
                    } else {
                        pointer++
                    }

                    countInsert = 0
                    countDelete = 0
                    textDelete = ''
                    textInsert = ''
                    break
            }
        }
        if (diffs[diffs.length - 1]![1] === '') {
            diffs.pop() // Remove the dummy entry at the end.
        }

        // Second pass: look for single edits surrounded on both sides by equalities
        // which can be shifted sideways to eliminate an equality.
        let changes = false
        pointer = 1
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1]![0] === DIFF_EQUAL && diffs[pointer + 1]![0] === DIFF_EQUAL) {
                // This is a single edit surrounded by equalities.
                if (
                    diffs[pointer]![1].substring(diffs[pointer]![1].length - diffs[pointer - 1]![1].length) ===
                    diffs[pointer - 1]![1]
                ) {
                    // Shift the edit over the previous equality.
                    diffs[pointer]![1] =
                        diffs[pointer - 1]![1] +
                        diffs[pointer]![1].substring(0, diffs[pointer]![1].length - diffs[pointer - 1]![1].length)
                    diffs[pointer + 1]![1] = diffs[pointer - 1]![1] + diffs[pointer + 1]![1]
                    diffs.splice(pointer - 1, 1)
                    changes = true
                } else if (diffs[pointer]![1].substring(0, diffs[pointer + 1]![1].length) === diffs[pointer + 1]![1]) {
                    // Shift the edit over the next equality.
                    diffs[pointer - 1]![1] += diffs[pointer + 1]![1]
                    diffs[pointer]![1] =
                        diffs[pointer]![1].substring(diffs[pointer + 1]![1].length) + diffs[pointer + 1]![1]
                    diffs.splice(pointer + 1, 1)
                    changes = true
                }
            }

            pointer++
        }

        // If shifts were made, the diff needs reordering and another shift sweep.
        if (changes) {
            this.cleanupMerge(diffs)
        }
    }

    public cleanupSemanticLossless(diffs: DiffTuple[]) {
        /**
         * Given two strings, compute a score representing whether the internal
         * boundary falls on logical boundaries.
         * Scores range from 6 (best) to 0 (worst).
         * Closure, but does not reference any external variables.
         * @param one First string.
         * @param two Second string.
         * @returns The score.
         */
        const cleanupSemanticScore = (one: string, two: string) => {
            if (!one || !two) {
                // Edges are the best.
                return 6
            }

            // Each port of this function behaves slightly differently due to
            // subtle differences in each language's definition of things like
            // 'whitespace'.  Since this function's purpose is largely cosmetic,
            // the choice has been made to use each language's native features
            // rather than force total conformity.
            const char1 = one.charAt(one.length - 1),
                char2 = two.charAt(0),
                nonAlphaNumeric1 = char1.match(this.nonAlphaNumericRegex),
                nonAlphaNumeric2 = char2.match(this.nonAlphaNumericRegex),
                whitespace1 = nonAlphaNumeric1 && char1.match(this.whitespaceRegex),
                whitespace2 = nonAlphaNumeric2 && char2.match(this.whitespaceRegex),
                lineBreak1 = whitespace1 && char1.match(this.lineBreakRegex),
                lineBreak2 = whitespace2 && char2.match(this.lineBreakRegex),
                blankLine1 = lineBreak1 && one.match(this.blankLineEndRegex),
                blankLine2 = lineBreak2 && two.match(this.blankLineStartRegex)

            if (blankLine1 || blankLine2) {
                // Five points for blank lines.
                return 5
            } else if (lineBreak1 || lineBreak2) {
                // Four points for line breaks.
                return 4
            } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
                // Three points for end of sentences.
                return 3
            } else if (whitespace1 || whitespace2) {
                // Two points for whitespace.
                return 2
            } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
                // One point for non-alphanumeric.
                return 1
            }
            return 0
        }

        let pointer = 1
        // Intentionally ignore the first and last element (don't need checking).
        while (pointer < diffs.length - 1) {
            if (diffs[pointer - 1]![0] === DIFF_EQUAL && diffs[pointer + 1]![0] === DIFF_EQUAL) {
                // This is a single edit surrounded by equalities.
                let equality1 = diffs[pointer - 1]![1],
                    edit = diffs[pointer]![1],
                    equality2 = diffs[pointer + 1]![1]

                // First, shift the edit as far left as possible.
                const commonOffset = this.commonSuffix(equality1, edit)

                if (commonOffset) {
                    const commonString = edit.substring(edit.length - commonOffset)
                    equality1 = equality1.substring(0, equality1.length - commonOffset)
                    edit = commonString + edit.substring(0, edit.length - commonOffset)
                    equality2 = commonString + equality2
                }

                // Second, step character by character right, looking for the best fit.
                let bestEquality1 = equality1,
                    bestEdit = edit,
                    bestEquality2 = equality2,
                    bestScore = cleanupSemanticScore(equality1, edit) + cleanupSemanticScore(edit, equality2)

                while (edit.charAt(0) === equality2.charAt(0)) {
                    equality1 += edit.charAt(0)
                    edit = edit.substring(1) + equality2.charAt(0)
                    equality2 = equality2.substring(1)
                    const score = cleanupSemanticScore(equality1, edit) + cleanupSemanticScore(edit, equality2)

                    // The >= encourages trailing rather than leading whitespace on edits.
                    if (score >= bestScore) {
                        bestScore = score
                        bestEquality1 = equality1
                        bestEdit = edit
                        bestEquality2 = equality2
                    }
                }

                if (diffs[pointer - 1]![1] !== bestEquality1) {
                    // We have an improvement, save it back to the diff.
                    if (bestEquality1) {
                        diffs[pointer - 1]![1] = bestEquality1
                    } else {
                        diffs.splice(pointer - 1, 1)
                        pointer--
                    }

                    diffs[pointer]![1] = bestEdit

                    if (bestEquality2) {
                        diffs[pointer + 1]![1] = bestEquality2
                    } else {
                        diffs.splice(pointer + 1, 1)
                        pointer--
                    }
                }
            }

            pointer++
        }
    }

    public commonOverlap(text1: string, text2: string) {
        // Cache the text lengths to prevent multiple calls.
        const text1Length = text1.length,
            text2Length = text2.length

        // Eliminate the null case.
        if (text1Length === 0 || text2Length === 0) {
            return 0
        }

        // Truncate the longer string.
        if (text1Length > text2Length) {
            text1 = text1.substring(text1Length - text2Length)
        } else if (text1Length < text2Length) {
            text2 = text2.substring(0, text1Length)
        }

        const textLength = Math.min(text1Length, text2Length)

        // Quick check for the worst case.
        if (text1 === text2) {
            return textLength
        }

        // Start by looking for a single character match
        // and increase length until no match is found.
        // Performance analysis: https://neil.fraser.name/news/2010/11/04/
        let best = 0,
            length = 1

        while (true) {
            const pattern = text1.substring(textLength - length),
                found = text2.indexOf(pattern)

            if (found === -1) {
                return best
            }

            length += found

            if (found === 0 || text1.substring(textLength - length) === text2.substring(0, length)) {
                best = length
                length++
            }
        }
    }

    public bisect(text1: string, text2: string, deadline: number): DiffTuple[] {
        // Cache the text lengths to prevent multiple calls.
        const text1_length = text1.length,
            text2_length = text2.length,
            max_d = Math.ceil((text1_length + text2_length) / 2),
            v_offset = max_d,
            v_length = 2 * max_d,
            v1 = new Array<number>(v_length),
            v2 = new Array<number>(v_length)

        // Setting all elements to -1 is faster in Chrome & Firefox than mixing
        // integers and undefined.
        for (let x = 0; x < v_length; x++) {
            v1[x] = -1
            v2[x] = -1
        }

        v1[v_offset + 1] = 0
        v2[v_offset + 1] = 0
        const delta = text1_length - text2_length,
            // If the total number of characters is odd, then the front path will collide
            // with the reverse path.
            front = delta % 2 != 0
        // Offsets for start and end of k loop.
        // Prevents mapping of space beyond the grid.
        let k1start = 0,
            k1end = 0,
            k2start = 0,
            k2end = 0

        for (let d = 0; d < max_d; d++) {
            // Bail out if deadline is reached.
            if (new Date().getTime() > deadline) {
                break
            }

            // Walk the front path one step.
            for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
                let k1_offset = v_offset + k1,
                    x1

                if (k1 === -d || (k1 != d && v1[k1_offset - 1]! < v1[k1_offset + 1]!)) {
                    x1 = v1[k1_offset + 1]!
                } else {
                    x1 = v1[k1_offset - 1]! + 1
                }

                let y1 = x1 - k1
                while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) === text2.charAt(y1)) {
                    x1++
                    y1++
                }

                v1[k1_offset] = x1

                if (x1 > text1_length) {
                    // Ran off the right of the graph.
                    k1end += 2
                } else if (y1 > text2_length) {
                    // Ran off the bottom of the graph.
                    k1start += 2
                } else if (front) {
                    let k2_offset = v_offset + delta - k1

                    if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset]! != -1) {
                        // Mirror x2 onto top-left coordinate system.
                        let x2 = text1_length - v2[k2_offset]!

                        if (x1 >= x2) {
                            // Overlap detected.
                            return this.bisectSplit(text1, text2, x1, y1, deadline)
                        }
                    }
                }
            }

            // Walk the reverse path one step.
            for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
                let k2_offset = v_offset + k2,
                    x2: number

                if (k2 === -d || (k2 != d && v2[k2_offset - 1]! < v2[k2_offset + 1]!)) {
                    x2 = v2[k2_offset + 1]!
                } else {
                    x2 = v2[k2_offset - 1]! + 1
                }

                let y2 = x2 - k2
                while (
                    x2 < text1_length &&
                    y2 < text2_length &&
                    text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)
                ) {
                    x2++
                    y2++
                }

                v2[k2_offset] = x2

                if (x2 > text1_length) {
                    // Ran off the left of the graph.
                    k2end += 2
                } else if (y2 > text2_length) {
                    // Ran off the top of the graph.
                    k2start += 2
                } else if (!front) {
                    let k1_offset = v_offset + delta - k2

                    if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset]! != -1) {
                        let x1 = v1[k1_offset]!,
                            y1 = v_offset + x1 - k1_offset
                        // Mirror x2 onto top-left coordinate system.
                        x2 = text1_length - x2

                        if (x1 >= x2) {
                            // Overlap detected.
                            return this.bisectSplit(text1, text2, x1, y1, deadline)
                        }
                    }
                }
            }
        }

        // Diff took too long and hit the deadline or
        // number of diffs equals number of characters, no commonality at all.
        return [new Diff(DIFF_DELETE, text1).toArray(), new Diff(DIFF_INSERT, text2).toArray()]
    }

    public bisectSplit(text1: string, text2: string, x: number, y: number, deadline: number): DiffTuple[] {
        const text1a = text1.substring(0, x),
            text2a = text2.substring(0, y),
            text1b = text1.substring(x),
            text2b = text2.substring(y)

        // Compute both diffs serially.
        const diffs: DiffTuple[] = this.main(text1a, text2a, deadline, false),
            diffsB: DiffTuple[] = this.main(text1b, text2b, deadline, false)

        return diffs.concat(diffsB)
    }

    public prettyMarkdown(diffs: DiffTuple[]) {
        const prettified: string[] = []

        for (let x = 0; x < diffs.length; x++) {
            const op = diffs[x]![0] // Operation (insert, delete, equal)
            const data = diffs[x]![1] // Text of change.

            switch (op) {
                case 1:
                    prettified[x] = '**' + data + '**'
                    break
                case -1:
                    prettified[x] = '~~' + data + '~~'
                    break
                case 0:
                    prettified[x] = data
                    break
            }
        }

        return prettified.join('')
    }
}

export class Diff {
    public op: number
    public text: string

    constructor(op: number, text: string) {
        this.op = op
        this.text = text
    }

    public toString() {
        return this.op + ',' + this.text
    }

    public toArray(): [number, string] {
        return [this.op, this.text]
    }
}
