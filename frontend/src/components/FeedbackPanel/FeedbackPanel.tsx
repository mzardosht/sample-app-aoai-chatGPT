import { Checkbox, DefaultButton, Label, Panel, PrimaryButton, Rating, RatingSize, TextField } from "@fluentui/react";
import { useId, useEffect, useState } from "react";
import { feedbackApi } from "../../api/esai.api";

import styles from "./FeedbackPanel.module.css";
import { ESAIDocFeedback, ESAIFeedback } from "../../api/esai.models";
import { ChatMessage, Citation, ToolMessageContent } from "../../api";

export interface IFeedbackPanelProps {
    isOpen: boolean;
    onDismiss: () => void;
    feedbackMessageIndex: number;
    chatMessages: ChatMessage[];
    selectedContentIndex: string;
    inDomain: boolean;
    allowContact: boolean;
}

export const FeedbackPanel: React.FC<IFeedbackPanelProps> = ({
    isOpen,
    onDismiss,
    feedbackMessageIndex,
    chatMessages,
    selectedContentIndex,
    inDomain,
    allowContact,
}) => {
    const [feedback, setFeedback] = useState<ESAIFeedback>({
        overall_response_quality: 3,
        overall_document_quality: 3,
        verbatim: "",
        inaccurate_answer: false,
        missing_info: false,
        too_long: false,
        too_short: false,
        confusing: false,
        offensive: false,
        biased: false,
        outdated: false,
        repetitive: false,
        fantastic: false,
        case_number: "",
        question_id: "",
        question: "",
        answer_id: "",
        answer: "",
        contentIndex: "",
        top_docs: [],
        in_domain: inDomain,
        // allow_contact: allowContact,
    });

    useEffect(() => {
        let questionId = "";
        let question = "";
        let answerId = "";
        let answer = "";
        let topDocs: ESAIDocFeedback[] = [];

        if (feedbackMessageIndex >= 1) {
            // questionId = chatMessages[feedbackMessageIndex - 1][0];
            question = chatMessages[feedbackMessageIndex - 2].content;

            // answerId = chatMessages[feedbackMessageIndex][0];
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
            }));
        }

        setFeedback({
            ...feedback,
            question_id: questionId,
            question: question,
            answer_id: answerId,
            answer: answer,
            contentIndex: selectedContentIndex,
            top_docs: topDocs,
            in_domain: inDomain,
            // allow_contact: allowContact,
        });
    }, [isOpen]);

    const onSubmit = () => {
        // void feedbackApi(feedback);
        onDismiss();
    };

    const overallRatingId = useId();
    const documentRatingId = useId();

    return (
        <Panel
            headerText="Feedback"
            isOpen={isOpen}
            isBlocking={true}
            onDismiss={onDismiss}
            closeButtonAriaLabel="Close"
            onRenderFooterContent={() => (
                <>
                    <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
                    <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
                </>
            )}
            isFooterAtBottom={true}
        >
            <Label htmlFor={overallRatingId}>Overall response quality</Label>
            <Rating
                id={overallRatingId}
                size={RatingSize.Large}
                allowZeroStars={false}
                max={5}
                defaultRating={3}
                onChange={(_ev, rating) => setFeedback({ ...feedback, overall_response_quality: rating ?? 1 })}
            />
            <br />
            <Label htmlFor={documentRatingId}>Overall document quality</Label>
            <Rating
                id={documentRatingId}
                size={RatingSize.Large}
                allowZeroStars={false}
                max={5}
                defaultRating={3}
                onChange={(_ev, rating) => setFeedback({ ...feedback, overall_document_quality: rating ?? 1 })}
            />
            <br />
            <hr />
            <br />
            <Checkbox
                label="Inaccurate"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, inaccurate_answer: !!value })}
            />
            <Checkbox
                label="Missing information"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, missing_info: !!value })}
            />
            <Checkbox
                label="Too long"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, too_long: !!value })}
            />
            <Checkbox
                label="Too short"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, too_short: !!value })}
            />
            <Checkbox
                label="Confusing"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, confusing: !!value })}
            />
            <Checkbox
                label="Offensive"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, offensive: !!value })}
            />
            <Checkbox
                label="Biased"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, biased: !!value })}
            />
            <Checkbox
                label="Outdated"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, outdated: !!value })}
            />
            <Checkbox
                label="Repetitive"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, repetitive: !!value })}
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
            {/* <TextField
                label="Case number"
                className={styles.TextField}
                onChange={(_ev, value) => setFeedback({ ...feedback, case_number: value ?? "" })}
            /> */}
            {/* <Checkbox
                label="Is it okay to contact me about this feedback?"
                className={styles.checkBox}
                onChange={(_ev, value) => setFeedback({ ...feedback, allow_contact: !!value })}
            /> */}
        </Panel>
    );
};
