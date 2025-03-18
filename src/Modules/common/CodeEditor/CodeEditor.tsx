import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { Button, Select, Modal } from 'antd';
import CodeMirror from '@uiw/react-codemirror';

import { ProgrammingLanguages, languageNameType, languageObjectType } from './ProgrammingLanguages';
import classes from './Editor.module.css';
import { IDispatch } from '../../../store';

interface ICodeEditorProps {
    languageName: string;
    handleLanguageChange: (lang: languageNameType) => void;
    handleReset: () => void;
    saveLoading: boolean;
    handleSave: () => void;
    lastSaved: number;
    code: string;
    codeEditorLang: languageObjectType['lang'];
    handleCodeChange: (value: string) => void;
    hideLanguageSelection: boolean;
    handleRun: () => void;
    assessmentId: string;
}

const options = Object.entries(ProgrammingLanguages).map(([key, value]) => ({
    label: value.name,
    value: value.name,
}));

const CodeEditor = (props: ICodeEditorProps) => {
    const { lastSaved, code, codeEditorLang, hideLanguageSelection, languageName, saveLoading, assessmentId } = props;
    const { handleCodeChange, handleRun, handleLanguageChange, handleReset, handleSave } = props;

    const dispatch = useDispatch<IDispatch>();

    const [pasteCount, setPasteCount] = useState<number>(0);
    const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
    const [warningMessage, setWarningMessage] = useState<string>('');
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = editorRef.current;
        if (!container) return;

        const handlePaste = (e: ClipboardEvent) => {
            const newPasteCount = pasteCount + 1;
            setPasteCount(newPasteCount);

            if (newPasteCount === 1) {
                setWarningMessage('Excessive pasting is discouraged.');
                setIsWarningVisible(true);
            } else if (newPasteCount === 2) {
                setWarningMessage('Excessive pasting is discouraged. Excessive pastes will be flagged.');
                setIsWarningVisible(true);
            } else if (newPasteCount === 3) {
                setWarningMessage('You have reached the maximum allowed pastes. Further pastes will be flagged.');
                setIsWarningVisible(true);
            } else {
                setWarningMessage('You have exceeded the paste limit. This will be considered as using external help.');
                setIsWarningVisible(true);
            }
        };

        container.addEventListener('paste', handlePaste);

        return () => {
            container.removeEventListener('paste', handlePaste);
        };
    }, [pasteCount, assessmentId, dispatch.pasteMonitor]);

    const closeWarning = () => {
        setIsWarningVisible(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleSave();
        }
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleRun();
        }
    };

    return (
        <div className={`${classes.content} ${classes.pane2}`} ref={editorRef}>
            <div className={classes.editorHeader}>
                <Select
                    value={languageName}
                    onChange={(value) => handleLanguageChange(value as languageNameType)}
                    style={{ width: '7rem' }}
                    options={options}
                    disabled={hideLanguageSelection ? true : false}
                />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {lastSaved && <div className="last-saved">Last Saved at {dayjs(lastSaved).format('hh:mm ss')}</div>}
                    <Button onClick={handleReset}>Reset</Button>
                    <Button loading={saveLoading} disabled={saveLoading} type="primary" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
            <CodeMirror
                onKeyDown={handleKeyDown}
                value={code}
                height="calc(100vh - 12rem)"
                theme="dark"
                extensions={[codeEditorLang]}
                onChange={handleCodeChange}
                style={{ padding: '0.5rem 1rem', overflow: 'auto' }}
            />

            <Modal
                title="Warning: Code Pasting Detected"
                open={isWarningVisible}
                onOk={closeWarning}
                onCancel={closeWarning}
                footer={[
                    <Button key="ok" type="primary" onClick={closeWarning}>
                        I Understand
                    </Button>,
                ]}
            >
                <p>{warningMessage}</p>
                <p>You have pasted {pasteCount} times.</p>
            </Modal>
        </div>
    );
};

export default CodeEditor;
