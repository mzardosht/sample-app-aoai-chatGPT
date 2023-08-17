import { useRef, useState, useEffect } from "react";
import { IconButton, Stack, ChoiceGroup, Label, MessageBar, MessageBarType } from "@fluentui/react";
import { BroomRegular, DismissRegular, SquareRegular, ShieldLockRegular, ErrorCircleRegular } from "@fluentui/react-icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import rehypeRaw from "rehype-raw"; 

import styles from "./Chat.module.css";
import ESAILogo from "../../assets/ESAILogoBeta.png";
import esaiStyles from "./Chat.esai.module.css";

import {
    ChatMessage,
    ConversationRequest,
    conversationApi,
    Citation,
    ToolMessageContent,
    ChatResponse,
    getUserInfo
} from "../../api";
import { Answer } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { Settings } from "../../api/esai.models";
import { FeedbackPanel } from "../../components/FeedbackPanel/FeedbackPanel";
import { SettingsPanel } from "../../components/SettingsPanel/SettingsPanel";
import { SettingsButton } from "../../components/SettingsButton";
import { Footer } from "../../components/Footer/Footer";
import appInsights from "../../appInsights";
import { systemMessageApi } from "../../api/api";


const Chat = () => {
    const [isFeedbackPanelOpen, setIsFeedbackPanelOpen] = useState(false);
    const [feedbackMessageIndex, setFeedbackMessageIndex] = useState(-1);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        in_domain_only: false,
    });

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showLoadingMessage, setShowLoadingMessage] = useState<boolean>(false);
    const [activeCitation, setActiveCitation] = useState<[content: string, id: string, title: string, filepath: string, url: string, metadata: string]>();
    const [isCitationPanelOpen, setIsCitationPanelOpen] = useState<boolean>(false);
    const [answers, setAnswers] = useState<ChatMessage[]>([]);
    const abortFuncs = useRef([] as AbortController[]);
    const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string>("");
    const [selectedOption, setSelectedOption] = useState<string>();   
    const [submitClicked, setSubmitClicked] = useState(false);  
    const [system_message, setSystemMessage] = useState<string>();
    
    const getUserInfoList = async () => {
        const userInfoList = await getUserInfo();
        if (userInfoList.length === 0 && window.location.hostname !== "127.0.0.1") {
            setShowAuthMessage(true);
        }
        else {
            setShowAuthMessage(false);
        }
        
        // If we have a user info list, set the user email
        if (userInfoList.length > 0) {
            setUserEmail(userInfoList[0].user_id);
        }
    }
        
    const generateAdditionalReferences = (question: string) => {  
        let vivaEngageLink = "https://web.yammer.com/main/groups/eyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIxMzM5NTIyODI2MjQifQ/all";
        let EXDAILink = "https://microsoft.sharepoint.com/teams/ExDAI"  
        let bingWorkLink = "https://www.bing.com/work/search?q=";

        let additionalReferences = `\n\n---\n Please help us learn by providing feedback through the thumbs up & down controls for each output the AI Learning Assistant generates. 

        \nPlease note that the AI Learning Assistant for E+D AI is growing, and we appreciate your questions as they help us improve the AI Learning Assistant and your experience with this tool. In the meantime:
        \n\u2022 For technical prompt engineering questions, check out the [E+D Prompt Engineering Community](${vivaEngageLink})
        \n\u2022 For general AI learning questions, click here to send your question to [Bing@Work](${bingWorkLink}${encodeURIComponent(question)}) or check your organization's learning site (find some of those at the bottom of the page [here](${EXDAILink}))

        \nThank you for your understanding!`;

        return additionalReferences;
    };

    const onSubmitQuestion = (question: string) => {  
        setSubmitClicked(true);  
        if (selectedOption) {  
            setIsLoading(true); 
            
            if (selectedOption === "Yes") {
                appInsights.trackEvent({ name: 'Question', properties: { alias: userEmail, question: question, system_message: system_message } });
            }
            makeApiRequest(question);  
        }  
    };  

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        setIsLoading(true);
        setShowLoadingMessage(true);
        const abortController = new AbortController();
        abortFuncs.current.unshift(abortController);

        const userMessage: ChatMessage = {
            role: "user",
            content: question
        };

        const request: ConversationRequest = {
            messages: [...answers.filter((answer) => answer.role !== "error"), userMessage],
            settings: settings,
        };

        let result = {} as ChatResponse;
        let answer = "";
        let citations: Citation[] = [];
        try {
            const response = await conversationApi(request, abortController.signal);
            if (response?.body) {
                
                const reader = response.body.getReader();
                let runningText = "";
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;

                    var text = new TextDecoder("utf-8").decode(value);
                    const objects = text.split("\n");
                    objects.forEach((obj) => {
                        try {
                            runningText += obj;
                            result = JSON.parse(runningText);
                            setShowLoadingMessage(false);
                            setAnswers([...answers, userMessage, ...result.choices[0].messages]);
                            runningText = "";
                        }
                        catch { }
                    });
                }
                // Extract the assistant messages  
                const assistantMessages = result.choices[0].messages.filter(msg => msg.role === "assistant");

                // Extract the tool messages  
                const toolMessages = result.choices[0].messages.filter(msg => msg.role === "tool");
                
                // If there is no response, throw an error
                if (assistantMessages.length === 0) {
                    throw new Error("No messages returned");                                
                }
                else if (!assistantMessages[assistantMessages.length - 1].content.includes("\n\n---\n")) {                    
                    let additionalReferences = generateAdditionalReferences(lastQuestionRef.current);
                    result.choices[0].messages.filter(msg => msg.role === "assistant")[assistantMessages.length - 1].content += "\n"+additionalReferences;
                }

                setAnswers([...answers, userMessage, ...result.choices[0].messages]);

                answer = assistantMessages[assistantMessages.length - 1].content;

                const toolMessage = JSON.parse(toolMessages[toolMessages.length-1].content) as ToolMessageContent;
                citations = toolMessage.citations;
                
                // Track the answer in app insights
                try {
                    if (selectedOption === "Yes")
                        appInsights.trackEvent({ name: 'Answer', properties: { 
                            alias: userEmail, 
                            question: question,
                            answer: answer,
                            top_docs: citations,
                            system_message: system_message} });
                }
                catch {
                    console.log("Error tracking answer");                    
                }
            }
            
        } catch ( e )  {
            if (!abortController.signal.aborted) {
                let errorMessage = "An error occurred. Please try again. If the problem persists, please contact the site administrator.";
                if (result && result.error?.message) {
                    errorMessage = result.error.message;
                }
                else if (result && typeof result.error === "string") {
                    errorMessage = result.error;
                }
                setAnswers([...answers, userMessage, {
                    role: "error",
                    content: errorMessage
                }]);
                if (selectedOption === "Yes")
                    appInsights.trackEvent({ name: 'Error', properties: { 
                        alias: userEmail, 
                        error: errorMessage,
                        question: question,
                        answer: answer,
                        top_docs: citations,
                        system_message: system_message } });                
                else 
                    appInsights.trackEvent({ name: 'Error', properties: { 
                        error: errorMessage,
                        question: question,
                        answer: answer,
                        top_docs: citations,
                        system_message: system_message } });
                
            } else {
                setAnswers([...answers, userMessage]);
            }
        } finally {
            setIsLoading(false);
            setShowLoadingMessage(false);
            abortFuncs.current = abortFuncs.current.filter(a => a !== abortController);
        }

        return abortController.abort();
    };

    const clearChat = () => {
        lastQuestionRef.current = "";
        setActiveCitation(undefined);
        setAnswers([]);
    };

    const stopGenerating = () => {
        abortFuncs.current.forEach(a => a.abort());
        setShowLoadingMessage(false);
        setIsLoading(false);
    }

    useEffect(() => {
        getUserInfoList();
    }, []);

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [showLoadingMessage]);

    useEffect(() => {
        systemMessageApi().then((value) => setSystemMessage(value));
    }, []);

    const onShowCitation = (citation: Citation) => {
        setActiveCitation([citation.content, citation.id, citation.title ?? "", citation.filepath ?? "", citation.url ?? "", ""]);
        setIsCitationPanelOpen(true);
    };

    const parseCitationFromMessage = (message: ChatMessage) => {
        if (message.role === "tool") {
            try {
                const toolMessage = JSON.parse(message.content) as ToolMessageContent;
                return toolMessage.citations;
            }
            catch {
                return [];
            }
        }
        return [];
    }

    const onLikeResponse = (index: number) => {
        let answer = answers[index];
        setFeedbackMessageIndex(index);
        setAnswers([...answers.slice(0, index), answer, ...answers.slice(index + 1)]);

        if (selectedOption === "Yes")
            appInsights.trackEvent({ name: 'Like', properties: { 
                alias: userEmail,
                answer: answer,
                system_message: system_message
            } });
    };

    const onDislikeResponse = (index: number) => {
        let answer = answers[index];
        setFeedbackMessageIndex(index);
        setIsFeedbackPanelOpen(!isFeedbackPanelOpen);
        setAnswers([...answers.slice(0, index), answer, ...answers.slice(index + 1)]);

        if (selectedOption === "Yes")
            appInsights.trackEvent({ name: 'DisLike', properties: { 
                alias: userEmail,
                answer: answer,
                system_message: system_message
            } });
    };

    return (
        <div className={styles.container}>
            {showAuthMessage ? (
                <Stack className={styles.chatEmptyState}>
                    <ErrorCircleRegular className={styles.chatIcon} style={{color: 'crimson'}}/>
                    <h1 className={styles.chatEmptyStateTitle}>Authentication Not Configured</h1>
                    <h2 className={styles.chatEmptyStateSubtitle}>This app does not have authentication configured. Please add an identity provider.</h2>
                    <h2 className={styles.chatEmptyStateSubtitle}>
                        Go to your app in the 
                        <a href="https://portal.azure.com/" target="_blank"> Azure Portal </a>
                         and follow 
                         <a href="https://learn.microsoft.com/en-us/azure/app-service/scenario-secure-app-authentication-app-service#3-configure-authentication-and-authorization" target="_blank"> these instructions</a>.
                    </h2>
                </Stack>
            ) : (
                <Stack horizontal className={styles.chatRoot}>
                    <div className={styles.chatContainer}>
                        {!lastQuestionRef.current ? (
                            <Stack className={styles.chatEmptyState}>
                                <img src={ESAILogo} height="233" width="233"></img>
                                <h1 className={styles.chatEmptyStateTitle}>Welcome to Your AI Learning Assistant!</h1>
                                <h2 className={styles.chatEmptyStateSubtitle}>The AI-enabled assistant for quick answers to your AI questions, powered by the expert resources on <a href="https://microsoft.sharepoint.com/teams/EraOfAI">Era of AI</a> and <a href="https://microsoft.sharepoint.com/teams/ExDAI">E+D AI</a></h2>
                                <br />
                                <div className={esaiStyles.additionalInstruction}>
                                    <p><strong>Try out some questions:</strong></p>
                                    <ul>
                                        <li>What is few shot learning?</li>
                                        <li>What is LangChain?</li>
                                        <li>Explain the different GPT-4 Variants.</li>
                                        <li>What is Codex? What are the different Codex models?</li>
                                        <li>What is Semantic Kernel? How can I get started with Semantic Kernel?</li>
                                        <li>What are the different prompt engineering playgrounds?</li>
                                        <li>What is the E+D Prompt Forum?</li>
                                        <li>What are the different sessions from the Live Weekly Prompt Engineering Office Hours Series?</li>
                                        <li>How can I reduce hallucinations with prompt engineering?</li>
                                    </ul>
                                    <br />
                                    <p>
                                        Please help us learn by providing feedback through the thumbs up & down controls for each output the AI Learning Assistant generates.
                                        <br />
                                        Please note that the AI Learning Assistant for E+D AI is growing, and we appreciate your questions as they help us improve the AI Learning Assistant
                                        <br />
                                        and your experience with this tool.
                                    </p>
                                </div>                                
                            </Stack>
                        ) : (
                            <div className={styles.chatMessageStream} style={{ marginBottom: isLoading ? "40px" : "0px"}}>
                                {answers.map((answer, index) => (
                                    <>
                                        {answer.role === "user" ? (
                                            <div className={styles.chatMessageUser}>
                                                <div className={styles.chatMessageUserMessage}>{answer.content}</div>
                                            </div>
                                        ) : (
                                            answer.role === "assistant" ? <div className={styles.chatMessageGpt}>
                                                <Answer
                                                    answer={{
                                                        answer: answer.content,
                                                        citations: parseCitationFromMessage(answers[index - 1]),
                                                    }}
                                                    onCitationClicked={c => onShowCitation(c)}
                                                    onLikeResponseClicked={() => onLikeResponse(index)}
                                                    onDislikeResponseClicked={() => onDislikeResponse(index)}
                                                />
                                            </div> : answer.role === "error" ? <div className={styles.chatMessageError}>
                                                <Stack horizontal className={styles.chatMessageErrorContent}>
                                                    <ErrorCircleRegular className={styles.errorIcon} style={{color: "rgba(182, 52, 67, 1)"}} />
                                                    <span>Error</span>
                                                </Stack>
                                                <span className={styles.chatMessageErrorContent}>{answer.content}</span>
                                            </div> : null
                                        )}
                                    </>
                                ))}
                                {showLoadingMessage && (
                                    <>
                                        <div className={styles.chatMessageUser}>
                                            <div className={styles.chatMessageUserMessage}>{lastQuestionRef.current}</div>
                                        </div>
                                        <div className={styles.chatMessageGpt}>
                                            <Answer
                                                answer={{
                                                    answer: "AI Learning Assistant is generating answer...",
                                                    citations: []
                                                }}
                                                onCitationClicked={() => null}
                                                onLikeResponseClicked={() => null}
                                                onDislikeResponseClicked={() => null}
                                            />
                                        </div>
                                    </>
                                )}
                                <div ref={chatMessageStreamEnd} />
                            </div>
                        )}

                        <Stack horizontal className={styles.chatInput}>
                            {isLoading && (
                                <Stack 
                                    horizontal
                                    className={styles.stopGeneratingContainer}
                                    role="button"
                                    aria-label="Stop generating"
                                    tabIndex={0}
                                    onClick={stopGenerating}
                                    onKeyDown={e => e.key === "Enter" || e.key === " " ? stopGenerating() : null}
                                    >
                                        <SquareRegular className={styles.stopGeneratingIcon} aria-hidden="true"/>
                                        <span className={styles.stopGeneratingText} aria-hidden="true">Stop generating</span>
                                </Stack>
                            )}
                            <BroomRegular
                                className={styles.clearChatBroom}
                                style={{ background: isLoading || answers.length === 0 ? "#BDBDBD" : "radial-gradient(109.81% 107.82% at 100.1% 90.19%, #0F6CBD 33.63%, #2D87C3 70.31%, #8DDDD8 100%)", 
                                        cursor: isLoading || answers.length === 0 ? "" : "pointer"}}
                                onClick={clearChat}
                                onKeyDown={e => e.key === "Enter" || e.key === " " ? clearChat() : null}
                                aria-label="Clear session"
                                role="button"
                                tabIndex={0}
                            />
                            <QuestionInput
                                clearOnSend
                                placeholder="Type a new question..."
                                disabled={isLoading}
                                onSend={question => onSubmitQuestion(question)}
                                optionSelected={selectedOption}
                            />
                        </Stack>
                        <Stack className={esaiStyles.collectDataOption}>
                            <Label id="optInLabel" className={`${esaiStyles.optInLabel} ${selectedOption || !submitClicked ? '' : esaiStyles.errorLabel}`}>
                            Help improve this tool and inform the addition of AI resources by sharing your alias, questions, and responses. <span className={esaiStyles.redAsterisk}>*</span>
                                <br/>
                                {userEmail && (
                                    <span>{`Logged in as ${userEmail}`}. </span>
                                )}
                                <span>Learn more about our data collection<a href="#" target="_blank">here</a></span>
                            </Label>
                            <div className={(selectedOption || !submitClicked ? '' : esaiStyles.redChoiceGroup)}>
                                <ChoiceGroup
                                    ariaLabelledBy="optInLabel"
                                    options={[
                                        {
                                            key: "Yes",
                                            text: "Yes",
                                            onRenderField: (props, render) => (
                                                <div className={(selectedOption || !submitClicked ? '' : esaiStyles.errorLabel)}>
                                                    {render!(props)}
                                                </div>),
                                        },
                                        {
                                            key: "No",
                                            text: "No",
                                            onRenderField: (props, render) => (
                                                <div className={(selectedOption || !submitClicked ? '' : esaiStyles.errorLabel)}>
                                                    {render!(props)}
                                                </div>),
                                        },
                                    ]}
                                    onChange={(ev, option) => option && setSelectedOption(option.key)}
                                    styles={{
                                        flexContainer: {
                                            display: 'inline-flex',
                                            flexDirection: 'row',
                                            gap: '6px',
                                            paddingLeft: '20px',
                                        }
                                    }}
                                />
                            </div>
                            {!selectedOption && submitClicked && (
                                <MessageBar  
                                    messageBarType={MessageBarType.error}  
                                    isMultiline={false} 
                                    styles={{ root: { marginTop: '5px', marginLeft: '10px', height: '35px', width: 'auto' } }}
                                >  
                                    Please select an option.  
                                </MessageBar> 
                            )}
                        </Stack>
                        <Footer />
                    </div>
                    {answers.length > 0 && isCitationPanelOpen && activeCitation && (
                    <Stack.Item className={styles.citationPanel} tabIndex={0} role="tabpanel" aria-label="Citations Panel">
                        <Stack aria-label="Citations Panel Header Container" horizontal className={styles.citationPanelHeaderContainer} horizontalAlign="space-between" verticalAlign="center">
                            <span aria-label="Citations" className={styles.citationPanelHeader}>Citations</span>
                            <IconButton iconProps={{ iconName: 'Cancel'}} aria-label="Close citations panel" onClick={() => setIsCitationPanelOpen(false)}/>
                        </Stack>
                        <h5 className={styles.citationPanelTitle}>{activeCitation[3]}</h5>
                        {activeCitation[4] ? (
                            <h5 className={styles.citationPanelSubtitle}>
                                <a href={activeCitation[4]} target="_blank">Click here to visit the citation page</a>
                            </h5>
                        ) : null}

                        <ReactMarkdown 
                            linkTarget="_blank"
                            className={styles.citationPanelContent}
                            children={activeCitation[0]} 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                        />
                    </Stack.Item>
                )}
                </Stack>
            )}
            <FeedbackPanel
                isOpen={isFeedbackPanelOpen}
                onDismiss={() => setIsFeedbackPanelOpen(false)}
                feedbackMessageIndex={feedbackMessageIndex}
                chatMessages={answers}
                allowContact={false}
                userEmail={userEmail}
                canCollectQuestion={selectedOption === "Yes"? true : false}
            />
            <SettingsPanel
                isOpen={isConfigPanelOpen}
                onSettingsChanged={(newSettings) => {

                    setSettings(newSettings);
                }}
                onDismiss={() => setIsConfigPanelOpen(false)}
            />
        </div>
    );
};

export default Chat;
