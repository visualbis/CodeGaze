import MDEditor from '@uiw/react-md-editor';
import classes from './Editor.module.css';
import { Challenge } from '../../../types/Models';
import Title from 'antd/es/typography/Title';
import React, { useEffect, useRef } from 'react';

const noSelectStyle: React.CSSProperties = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
};

const QuestionContent = ({
    challenge,
    hideTitle = false,
    editorStyles = {},
}: {
    challenge: Pick<Challenge, 'description' | 'name'>;
    hideTitle?: boolean;
    editorStyles?: React.CSSProperties;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            return false;
        };

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        const preventSelection = () => {
            if (document.getSelection) {
                document.getSelection()?.empty();
            }
        };

        container.addEventListener('copy', preventCopy);
        container.addEventListener('contextmenu', preventContextMenu);
        container.addEventListener('selectstart', preventContextMenu);
        container.addEventListener('mouseup', preventSelection);

        return () => {
            container.removeEventListener('copy', preventCopy);
            container.removeEventListener('contextmenu', preventContextMenu);
            container.removeEventListener('selectstart', preventContextMenu);
            container.removeEventListener('mouseup', preventSelection);
        };
    }, []);

    return (
        <div ref={containerRef} className={`${classes.content} ${classes.pane1}`} style={noSelectStyle}>
            {!hideTitle && (
                <Title style={{ margin: '0.5rem 0' }} level={5}>
                    {challenge?.name}
                </Title>
            )}
            <MDEditor
                value={challenge?.description}
                hideToolbar={true}
                preview={'preview'}
                style={{ ...editorStyles, ...noSelectStyle }}
                height={editorStyles.height}
            />
        </div>
    );
};

export default QuestionContent;
