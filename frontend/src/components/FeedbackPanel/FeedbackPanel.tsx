import { Checkbox, DefaultButton, Label, Panel, PrimaryButton, Rating, RatingSize, TextField } from "@fluentui/react";
import { useId, useEffect, useState } from "react";
import { systemMessageApi } from "../../api/api";
import appInsights from '../../appInsights';

import styles from "./FeedbackPanel.module.css";
import { ESAIDocFeedback, ESAIFeedback } from "../../api/esai.models";
import { ChatMessage, Citation, ToolMessageContent } from "../../api";

export interface IFeedbackPanelProps {
    isOpen: boolean;
    onDismiss: () => void;
    feedbackMessageIndex: number;
    chatMessages: ChatMessage[];
    userEmail: string;
    allowContact: boolean;
    canCollectQuestion: boolean;
}

export const FeedbackPanel: React.FC<IFeedbackPanelProps> = ({
    isOpen,
    onDismiss,
    feedbackMessageIndex,
    chatMessages,
    userEmail,
    allowContact,
    canCollectQuestion,
}) => {
    const [feedback, setFeedback] = useState<ESAIFeedback>({
        verbatim: "",
        inaccurate_answer: false,
        insufficient: false,
        outdated: false,
        question: "",
        answer: "",
        top_docs: [],
        allow_contact: allowContact,
        email:  "",
        system_message: "",
    });
    const [system_message, setSystemMessage] = useState<string>();

    useEffect(() => {
        let question = "";
        let answer = "";
        let topDocs: ESAIDocFeedback[] = [];

        if (feedbackMessageIndex >= 1) {
            question = chatMessages[feedbackMessageIndex - 2].content;

            answer = chatMessages[feedbackMessageIndex].content;

            // Parse out citations from the "tool" role message
            let citations: Citation[] = [];
            if (chatMessages[feedbackMessageIndex - 1].role == "tool") {
                try {
                    const toolMessage = JSON.parse(chatMessages[feedbackMessageIndex - 1].content) as ToolMessageContent;
                    citations = toolMessage.citations;
                }
                catch {
                    // Failure to parse tool message, weird - but not fatal
                }
            }
            topDocs = citations.map((d) => ({
                title: d.title ?? "",
                filepath: d.filepath ?? "",
                url: d.url ?? "",
            }));

            systemMessageApi().then((value) => setSystemMessage(value));
        }

        setFeedback({
            ...feedback,
            question: question,
            answer: answer,
            top_docs: topDocs,
            allow_contact: allowContact,
            email: allowContact? userEmail: "",
            system_message: system_message? system_message: "",
        });
    }, [isOpen]);

    const onSubmit = () => {
        // void feedbackApi(feedback);
        appInsights.trackEvent({ name: 'Feedback', properties: { feedback: feedback } });

        onDismiss();
    };

    return (
        <Panel
            headerText="Feedback to Microsoft"
            isOpen={isOpen}
            isBlocking={true}
            onDismiss={onDismiss}
            closeButtonAriaLabel="Close"
            onRenderFooterContent={() => (
                <>
                    <div className={styles.privacyStatement}>By pressing submit, your feedback will be used to improve this product.
                    By including your email address, you agree that we can email you about your feedback. 
                    <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer">Privacy Statement</a>.</div> 
                    <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
                    <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
                </>
            )}
            isFooterAtBottom={true}
            isLightDismiss={true}
        >
            <br />
            <Label>Your feedback will help improve the experience.</Label>
            <Label>Why wasn't this response helpful?</Label>
            <Checkbox
                label="Inaccurate"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, inaccurate_answer: !!value })}
            />
            <Checkbox
                label="Insufficient"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, insufficient: !!value })}
            />
            <Checkbox
                label="Outdated"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, outdated: !!value })}
            />
            <br />
            <hr />
            <br />
            <TextField
                label="Additional feedback - provide details on citations and answer quality."
                multiline
                autoAdjustHeight
                onChange={(_ev, value) => setFeedback({ ...feedback, verbatim: value ?? "" })}
            />
            <Checkbox
                label={`You can contact me about my feedback${userEmail ? `:\n${userEmail}` : ""}`}
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, allow_contact: !!value })}
            />
        </Panel>
    );
};
