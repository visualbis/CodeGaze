import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { Button, Skeleton, Tabs } from 'antd';
import TabPane from 'antd/es/tabs/TabPane';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ChallengesAssessment from './components/ChallengesAssessment';
import ExamSettings from './components/ExamSettings';
import { useEffect, useState } from 'react';
import Title from 'antd/es/typography/Title';
import { ChallengeAPIService } from '../Challenges/services/Challenge.API';
import { ExamQueryResult } from './ExamList';
import { toast } from 'react-toastify';
import { ExamAPIService } from './services/Exam.API';
import { ROUTES } from '../../constants/Route.constants';

export type ChallengeResult = Awaited<ReturnType<typeof ChallengeAPIService.getAll>>;
interface Time {
    hr: number,
    min: number
}

const ExamDetail = () => {
    const { state } = useLocation();
    const exam = state?.exam as ExamQueryResult[number];
    const [name, setName] = useState(exam?.name || '');
    const [challenges, setChallenges] = useState<ChallengeResult>([]);
    const [time, setTime] = useState<Time>({hr: ~~(exam.duration/60), min: exam.duration%60})
    // const [duration, setDuration] = useState(exam?.duration || 0);
    const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (exam.challenge) {
            setSelectedChallenges(new Set(exam.challenge.map((challenge) => challenge.id)));
        }
    }, [exam]);

    const addChallenge = (challenge: ChallengeResult[number]) => {
        setSelectedChallenges((prevChallenges) => new Set([...prevChallenges, challenge.id]));
    };

    const deleteChallenge = (challenge: ChallengeResult[number]) => {
        setSelectedChallenges((prevChallenges) => {
            const newChallenges = new Set(prevChallenges);
            newChallenges.delete(challenge.id);
            return newChallenges;
        });
    };

    const handleSettingsChange = (value) => {
        const Timeduration = value.split(" ");
        setTime({
            ...time,
            [Timeduration[1]] : Number(Timeduration[0])
        })
    };

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const data = await ChallengeAPIService.getAll();
            setChallenges(data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const challengesFromExam = new Set(exam.challenge.map((challenge) => challenge.id));
            const hasChallengesChanged = !(
                challengesFromExam.size === selectedChallenges.size &&
                [...challengesFromExam].every((challengeId) => selectedChallenges.has(challengeId))
            );
            const hasNameChanged = name !== exam.name;
            const hasDurationChanged = ((time.hr*60) + time.min) !== exam.duration;
            if (hasChallengesChanged) await ExamAPIService.updateExamChallenges(exam.id, selectedChallenges);
            if (hasNameChanged) await saveExamName(name);
            if(hasDurationChanged) await saveDuration((time.hr*60) + time.min);
        } catch (error) {
            toast.error(error?.message || 'Error saving exam');
        } finally {
            setSaveLoading(false);
        }
    };

    const saveDuration = async (duration: number) => {
        try {
            await ExamAPIService.update({
                id: exam.id,
                duration
            })
        } catch (error) {
            toast.error(error?.message || 'Error saving exam');
        }
    }

    const saveExamName = async (name: string) => {
        try {
            await ExamAPIService.update({
                id: exam.id,
                name,
            });
        } catch (error) {
            toast.error(error?.message || 'Error saving exam');
        }
    };

    const onDelete = async () => {
        try {
            setDeleteLoading(true);
            await ExamAPIService.delete(exam.id);
            navigate(`${ROUTES.EXAM}/open`);
            toast.success('Exam deleted');
        } catch (error) {
            toast.error(error?.message || 'Error deleting exam');
        } finally {
            setSaveLoading(false);
        }
    };

    const challengesAvailable = challenges.filter((challenge) => !selectedChallenges.has(challenge.id));
    const selectedChallengesArray = challenges.filter((challenge) => selectedChallenges.has(challenge.id));
    return (
        <div style={{ padding: '2rem' }}>
            <Link to="/assessments/open">
                <Button type="link" icon={<ArrowLeftOutlined />}></Button> back to candidate results
            </Link>

            <div style={{ float: 'right', display: 'flex', padding: '10px' }}>
                <Button type="link" icon={<CopyOutlined />}>
                    Duplicate
                </Button>
                {/* <Button type="link" icon={<SelectOutlined />}>
                    Preview
                </Button> */}
                <Button loading={saveLoading} type="primary" onClick={handleSave}>
                    save
                </Button>
            </div>
            <Title
                onInput={(e) => setName((e.target as HTMLElement).textContent)}
                style={{ outline: 'none' }}
                contentEditable={true}
                level={3}
            >
                {exam?.name}
            </Title>
            <div>
                <Tabs>
                    <TabPane tab="Challenges" key="1">
                        {loading ? (
                            <Skeleton />
                        ) : (
                            <ChallengesAssessment
                                challenges={challengesAvailable}
                                addChallenge={addChallenge}
                                selectedChallenges={selectedChallengesArray}
                                deleteChallenge={deleteChallenge}
                            />
                        )}
                    </TabPane>

                    <TabPane tab="Settings" key="2">
                        <ExamSettings onDelete={onDelete} duration={time} addDuration={handleSettingsChange} />
                    </TabPane>
                </Tabs>
            </div>
        </div>
    );
};
export default ExamDetail;
