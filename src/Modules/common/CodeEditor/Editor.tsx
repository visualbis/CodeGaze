import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAutosave } from 'react-autosave';
// SplitPane imports
import SplitPane, { Pane } from 'split-pane-react';
import 'split-pane-react/esm/themes/default.css';
// Components Import
import QuestionContent from './QuestionContent';
import CodeEditor from './CodeEditor';
import Output from './Output';
import TestCaseTable from './TestCaseTable';
import {
    Language,
    ProgrammingLanguages,
    languageNameType,
    languageObjectType,
    languagesNameMap,
} from './ProgrammingLanguages';
import { CodeGenerator } from '../../CodeGeneration/CodeGenerator';
import { CodeEvaluator } from '../../CodeEvaluator/CodeEvaluator';
import { AssessmentUpdateDto, Challenge } from '../../../types/Models';
import classes from './Editor.module.css';
import { useDispatch } from 'react-redux';
import { IDispatch, IRootState } from '../../../store';
import { supabase } from '../../API/supabase';
import { FUNCTIONS } from '../../../constants/functions.constants';
import { toast } from 'react-toastify';
import { ROUTES } from '../../../constants/Route.constants';
import './styles/Editor.css';
import { Typography } from 'antd';
import { invokeSupabaseFunction } from '../../API/APIUtils';
import jwt_decode from 'jwt-decode';
import Timer from '../../CandidateAssessment/components/Timer';
const { Title } = Typography;
    
interface IProps {
    assessment: IRootState['assessment'];
    challenge: Challenge;
    candidate: IRootState['candidate'];
    isReportPage: boolean;
}

const Editor = ({ challenge, assessment, candidate, isReportPage }: IProps) => {
    const [sizes, setSizes] = useState([600, '100%', 750]);
    const [selectEditorLanguage, setSelectEditorLanguage] = useState<languageObjectType>(
        languagesNameMap[assessment?.language] || ProgrammingLanguages.javaScript,
    );
    const [code, setCode] = useState<string>(assessment?.code || '');
    const [output, setOutput] = useState<string>('');
    const [result, setResult] = useState<boolean[]>([]);
    const [runLoading, setrunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [testCaseLoading, setTestCaseLoading] = useState(false);
    const [lastSaved, setlastSaved] = useState(null);
    const expiry = (jwt_decode(candidate?.token) as { exp: number })?.exp;
    const now = Date.now() / 1000;
    const timeLeft = Math.round(expiry - now);

    const evaluator = new CodeEvaluator(
        selectEditorLanguage.name,
        challenge?.input_output?.inputType,
        challenge?.input_output?.outputType,
    );

    const navigate = useNavigate();
    const dispatch = useDispatch<IDispatch>();

    const handleLanguageChange = (selectedLanguage: languageNameType) => {
        setSelectEditorLanguage(languagesNameMap[selectedLanguage]);
        updateBoilerplateCode(selectedLanguage);
    };

    useEffect(() => {
        if (!assessment?.code) {
            updateBoilerplateCode(selectEditorLanguage['name'] || Language.JAVASCRIPT);
        }
    }, []);

    const handleCodeChange = (value: string) => {
        setCode(value);
    };

    const handleRun = async () => {
        try {
            setrunLoading(true);
            setOutput('');
            const result = await evaluator.runAndEvaluateCode(code, challenge?.input_output?.inputOutput);
            setOutput(result.stderr || result.stdout);
            setrunLoading(false);
            if (result.stdout === null) {
                setOutput(
                    `${result.status.description !== 'Accepted' ? result.status.description : ''}\n${result.stderr}\n${
                        result.compile_output !== null ? result.compile_output : ''
                    }`,
                );
            }
        } catch (error) {
            setrunLoading(false);
            if (error.response && error.response.data) {
                setOutput(`Compiler Error: ${error.response.data.error}`);
            } else {
                setOutput('An error occurred while compiling the code.');
            }
            console.error('Error running code:', error);
        }
    };

    const updateBoilerplateCode = (languageSelected: languageNameType) => {
        const generator = new CodeGenerator(
            languageSelected,
            challenge?.input_output?.inputType,
            challenge?.input_output?.outputType,
        );
        const starterCode = generator.generateStarterCode();
        setCode(starterCode);
    };

    const handleReset = () => {
        updateBoilerplateCode(selectEditorLanguage['name']);
        setOutput('');
    };

    const handleTestCase = async () => {
        try {
            setTestCaseLoading(true);
            const { result, output } = await evaluator.evaluate(code, challenge?.input_output?.inputOutput);
            setOutput(output);
            setTestCaseLoading(false);
            setResult(result);
        } catch (error) {
            setTestCaseLoading(false);
            console.error('Error evaluating code:', error);
        }
    };

    const handleSave = async (code: string) => {
        try {
            setSaveLoading(true);
            await saveCode(code);
            setSaveLoading(false);
        } catch (error) {
            setSaveLoading(false);
            toast.error(error.message ?? 'Error saving code');
            console.error('Error evaluating code:', error);
        }
    };

    async function saveCode(code: string) {
        if (candidate?.token) {
            await invokeSupabaseFunction<AssessmentUpdateDto>(FUNCTIONS.UPDATE_ASSESSMENT, {
                id: assessment.id,
                code,
                language: selectEditorLanguage.name,
            } as AssessmentUpdateDto);
            setlastSaved(Date.now());
            dispatch.assessment.update({ ...assessment, code, language: selectEditorLanguage.name });
        }
    }

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true);
            const { result, memory, time } = await evaluator.evaluate(code, challenge?.input_output?.inputOutput);
            await supabase.functions.setAuth(candidate?.token);
            await invokeSupabaseFunction<AssessmentUpdateDto>(FUNCTIONS.SUBMIT_EXAM, {
                id: assessment.id,
                code,
                language: selectEditorLanguage.name,
                result,
                execution_memory: memory,
                execution_time: Number(time),
            } as AssessmentUpdateDto);
            resetLocalState();
            dispatch.assessment.clear();
            navigate(ROUTES.ASSESSMENT_OVER);
            setSubmitLoading(false);
        } catch (error) {
            setSubmitLoading(false);
            toast.error(error.message ?? 'Error submitting code');
            console.error('Error evaluating code:', error);
        }
    };

    const resetLocalState = () => {
        setCode('');
        setOutput('');
        setTestCaseLoading(false);
        setSubmitLoading(false);
    };

    const handleTimeout = ()=>{
        handleSubmit();
    }

    useAutosave({ data: code, onSave: saveCode, interval: 1000 });
    
    return (
        <div>
            <div className={classes.main} style={{ padding: '1rem' }}>
                <SplitPane
                    split="vertical"
                    sizes={sizes}
                    onChange={setSizes}
                    sashRender={() => {
                        return <div></div>;
                    }}
                >
                     <Pane>
                        <QuestionContent challenge={challenge} editorStyles={{ height: 'calc(100% - 30px)' }} />
                    </Pane>
                    <Pane className={classes.Resizer} style={{ margin: '2px'}}>
                        <CodeEditor
                            languageName={selectEditorLanguage.name}
                            handleLanguageChange={handleLanguageChange}
                            handleReset={handleReset}
                            saveLoading={saveLoading}
                            handleSave={() => handleSave(code)}
                            code={code}
                            lastSaved={lastSaved}
                            codeEditorLang={selectEditorLanguage.lang}
                            handleCodeChange={handleCodeChange}
                            hideLanguageSelection ={isReportPage}
                        />
                    </Pane>
                    <Pane>
                        {expiry && <div style={{padding: '0 2rem'}}>
                            <Timer timeLeft={timeLeft} onTimeout={handleTimeout}/>
                        </div>}
                        <div className="output-container" style={{ padding: '0 1rem' }}>
                            <Output
                                output={output}
                                runLoading={runLoading}
                                handleRun={handleRun}
                                testCaseLoading={testCaseLoading}
                                handleTestCase={handleTestCase}
                                submitLoading={submitLoading}
                                handleSubmit={handleSubmit}
                                hideSubmitButton = {isReportPage}
                            />
                            <Title level={4}>
                                Test Cases{' '}
                                {result?.length ? `${result.filter((_) => _).length}/${result.length} Passed` : ''}
                            </Title>
                            <TestCaseTable
                                input_output={
                                    challenge?.input_output || {
                                        inputOutput: [],
                                        inputType: [],
                                        outputType: null,
                                    }
                                }
                                result={result}
                            />
                        </div>
                    </Pane>
                </SplitPane>
            </div>
        </div>
    );
};

export default Editor;
