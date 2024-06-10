import { Button, Form, Layout, Popconfirm, Select, Space } from 'antd';

const { Option } = Select;

const ExamSettings = ({ addDuration, onDelete, duration }) => {
  
    return (
        <Layout style={{ padding: '24px' }}>
            <Form>
                <Form.Item label="Time limit">
                    <Space direction="horizontal">
                        <Select placeholder="No hour limit" value={`${duration.hr} hr`} style={{ width: 180 }} onChange={addDuration}>
                            <Option value="0 hr">0 hr</Option>
                            <Option value="1 hr">1 hr</Option>
                            <Option value="2 hr">2 hr</Option>
                            <Option value="3 hr">3 hr</Option>
                            {/* Add more options as needed */}
                        </Select>
                        <Select placeholder="No minute limit" value={`${duration.min} min`} style={{ width: 180 }} onChange={addDuration}>
                            <Option value="00 min">00 min</Option>
                            <Option value="15 min">15 min</Option>
                            <Option value="30 min">30 min</Option>
                            <Option value="45 min">45 min</Option>
                            {/* Add more options as needed */}
                        </Select>
                    </Space>
                </Form.Item>
                <Form.Item>
                    <Popconfirm
                        title="Delete the Exam"
                        description="Are you sure to delete the Exam?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={onDelete}
                    >
                        <Button  danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Form.Item>
            </Form>
        </Layout>
    );
};

export default ExamSettings;
