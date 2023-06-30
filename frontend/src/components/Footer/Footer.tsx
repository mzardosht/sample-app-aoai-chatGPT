import { mergeStyleSets } from "@fluentui/react";
import { useEffect, useState } from "react";
import { azureIndexDateApi } from "../../api/esai.api";

const styles = mergeStyleSets({
    container: {
        marginTop: 20,
        fontFamily: "Segoe UI",
        fontWeight: 400,
        fontSize: "16px",
        fontStyle: "normal",
        color: "#616161",
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
    },
    placeholder: {
        width: "33%",
    },
    confidential: {
        fontWeight: 400,
        fontSize: "16px",
        width: "33%",
    },
    updateTime: {
        width: "33%",
    },
});

export const Footer: React.FC = () => {
    // const [lastUpdated, setLastUpdated] = useState<string>();
    // useEffect(() => {
    //     azureIndexDateApi().then((value) => setLastUpdated(value));
    // }, []);

    return (
        <div className={styles.container}>
            <div className={styles.placeholder}></div>
            <h6 className={styles.confidential}>
                <i>Microsoft Confidential</i>
            </h6>
            {/* <div className={styles.updateTime}>Data Refreshed On: {lastUpdated}</div> */}
        </div>
    );
};
