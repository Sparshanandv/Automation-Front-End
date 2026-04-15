import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface RichTextEditorProps {
    value: string
    onChange: (content: string) => void
    placeholder?: string
    id?: string
    maxLength?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    id,
    maxLength = 500
}) => {
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
        ],
    }

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet'
    ]

    const handleChange = (content: string, _delta: any, _source: any, editor: any) => {
        const text = editor.getText()
        if (text.length <= maxLength + 1) { // +1 for the trailing newline Quill always adds
            onChange(content)
        }
    }

    return (
        <div className="rich-text-editor-container" id={id}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-lg"
            />
            <style>{`
        .rich-text-editor-container .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-size: 14px;
        }
        .rich-text-editor-container .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor-container .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f9fafb;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
        </div>
    )
}

export default RichTextEditor