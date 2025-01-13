import { loader, install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === 'json') return new jsonWorker()
            if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
            if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
            if (label === 'typescript' || label === 'javascript') return new tsWorker()

            return new editorWorker()
        }
    }

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        allowJs: true,
        lib: ['es2023']
    })

    const extraLibs = [
        {
            content: process.env.MEDITOR_LIB_LACUNA_CB,
            filePath: 'ts:filename/lib.lacuna-cb.d.ts'
        }
    ]

    for (const lib of extraLibs) {
        monaco.languages.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath)
        monaco.editor.createModel(lib.content, 'typescript', monaco.Uri.parse(lib.filePath))
    }

    loader.config({ monaco })
    app.use(VueMonacoEditorPlugin)
})
