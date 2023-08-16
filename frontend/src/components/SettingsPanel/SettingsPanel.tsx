import { Checkbox, DefaultButton, Dropdown, IDropdownOption, Panel } from "@fluentui/react";
import { useState } from "react";
import { Settings } from "../../api/esai.models";

import styles from "./SettingsPanel.module.css";

export interface ISettingsPanelProps {
  isOpen: boolean;
  onSettingsChanged: (settings: Settings) => void;
  onDismiss: () => void;
}

export const SettingsPanel : React.FC<ISettingsPanelProps> = ({ isOpen, onSettingsChanged, onDismiss }) => {
  const [enableInDomainOnly, setEnableInDomainOnly] = useState<boolean>(true);

  const onInDomainOnlyChanged = (
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    checked?: boolean
  ) => {
    setEnableInDomainOnly(checked || false);
  };

  const handleDismiss = () => {
    onSettingsChanged({in_domain_only: enableInDomainOnly});
    onDismiss();
  }

  return (
    <Panel
      headerText="Configure Resources"
      isOpen={isOpen}
      isBlocking={true}
      onDismiss={handleDismiss}
      closeButtonAriaLabel="Close"
      onRenderFooterContent={() => (
        <DefaultButton onClick={handleDismiss}>
          Close
        </DefaultButton>
      )}
      isFooterAtBottom={true}
      isLightDismiss={true}
    >
      <Checkbox
        className={styles.chatSettingsSeparator}
        checked={enableInDomainOnly}
        label="Answer in-domain questions only"
        onChange={onInDomainOnlyChanged}
      />
    </Panel>
  );
};
