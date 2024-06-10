import { Typography } from 'antd';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
const { Title } = Typography;

interface IProps {
    timeLeft: number;
    onTimeout: () => void;
}

const Timer: React.FC<IProps> = (props: IProps) => {
    const [timeLeft, setTimeLeft] = useState(props.timeLeft);

    useEffect(() => {
        setTimeLeft(props.timeLeft);
    }, [props.timeLeft]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTimeLeft) => {
                if (prevTimeLeft === 0) return 0;
                return prevTimeLeft - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;

        if (hours === 0 && minutes === 5 && seconds === 0) toast.warning('Only 5 minutes left');

        if (hours === 0 && minutes === 1 && seconds === 0) toast.warning('Only 1 minutes left');

        if(hours === 0 && minutes === 0 && seconds === 20) toast.warning("Assessment will be submitted automatically in 10 seconds");

        if(hours === 0 && minutes === 0 && seconds === 10){
            props.onTimeout();
            toast.success("Assessment submitted successfully!")
        }

    }, [timeLeft]);

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds
            .toString()
            .padStart(2, '0')}`;
    };

    return (
        <Title level={4} style={{ margin: 0, color: 'red' }}>
            <div className="flex-container row timer">
                Time Left : <span>{formatTime(timeLeft)}</span>
            </div>
        </Title>
    );
};

export default Timer;
