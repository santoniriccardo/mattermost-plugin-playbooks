// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, ComponentProps} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {useDispatch} from 'react-redux';

import {getProfilesInTeam, searchProfiles} from 'mattermost-redux/actions/users';

import styled from 'styled-components';
import {PlayIcon} from '@mattermost/compass-icons/components';
import Icon from '@mdi/react';
import {mdiAccountCheckOutline} from '@mdi/js';

import {FullPlaybook, Loaded, useUpdatePlaybook} from 'src/graphql/hooks';

import {Section, SectionTitle} from 'src/components/backstage/playbook_edit/styles';
import {InviteUsers} from 'src/components/backstage/playbook_edit/automation/invite_users';
import {AutoAssignOwner} from 'src/components/backstage/playbook_edit/automation/auto_assign_owner';
import {WebhookSetting} from 'src/components/backstage/playbook_edit/automation/webhook_setting';
import {CategorizePlaybookRun} from 'src/components/backstage/playbook_edit/automation/categorize_playbook_run';
import {CreateAChannel} from 'src/components/backstage/playbook_edit/automation/channel_access';
import {PROFILE_CHUNK_SIZE} from 'src/constants';
import MarkdownEdit from 'src/components/markdown_edit';
import {Toggle} from '../../playbook_edit/automation/toggle';
import {AutomationTitle} from '../../playbook_edit/automation/styles';
import {useProxyState} from 'src/hooks';

interface Props {
    playbook: Loaded<FullPlaybook>;
}

const LegacyActionsEdit = ({playbook}: Props) => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const updatePlaybook = useUpdatePlaybook(playbook.id);
    const archived = playbook.delete_at !== 0;

    const [
        playbookForCreateChannel,
        setPlaybookForCreateChannel,
    ] = useProxyState<ComponentProps<typeof CreateAChannel>['playbook']>(playbook, useCallback((update) => {
        updatePlaybook({
            createPublicPlaybookRun: update.create_public_playbook_run,
            channelNameTemplate: update.channel_name_template,
        });
    }, [updatePlaybook]));

    const searchUsers = (term: string) => {
        return dispatch(searchProfiles(term, {team_id: playbook.team_id}));
    };

    const getUsers = () => {
        return dispatch(getProfilesInTeam(playbook.team_id, 0, PROFILE_CHUNK_SIZE, '', {active: true}));
    };

    const handleAddUserInvited = (userId: string) => {
        if (!playbook.invited_user_ids.includes(userId)) {
            updatePlaybook({
                invitedUserIDs: [...playbook.invited_user_ids, userId],
            });
        }
    };

    const handleRemoveUserInvited = (userId: string) => {
        const idx = playbook.invited_user_ids.indexOf(userId);
        updatePlaybook({
            invitedUserIDs: [...playbook.invited_user_ids.slice(0, idx), ...playbook.invited_user_ids.slice(idx + 1)],
        });
    };

    const handleAssignDefaultOwner = (userId: string | undefined) => {
        if ((userId || userId === '') && playbook.default_owner_id !== userId) {
            updatePlaybook({
                defaultOwnerID: userId,
            });
        }
    };

    const handleWebhookOnCreationChange = (urls: string) => {
        updatePlaybook({
            webhookOnCreationURLs: urls.split('\n'),
        });
    };

    const handleToggleInviteUsers = () => {
        updatePlaybook({
            inviteUsersEnabled: !playbook.invite_users_enabled,
        });
    };

    const handleToggleDefaultOwner = () => {
        updatePlaybook({
            defaultOwnerEnabled: !playbook.default_owner_enabled,
        });
    };

    const handleToggleWebhookOnCreation = () => {
        updatePlaybook({
            webhookOnCreationEnabled: !playbook.webhook_on_creation_enabled,
        });
    };

    const handleToggleCategorizePlaybookRun = () => {
        updatePlaybook({
            categorizeChannelEnabled: !playbook.categorize_channel_enabled,
        });
    };

    const handleCategoryNameChange = (categoryName: string) => {
        if (playbook.category_name !== categoryName) {
            updatePlaybook({
                categoryName,
            });
        }
    };

    return (
        <>
            <StyledSection>
                <StyledSectionTitle>
                    <PlayIcon size={24}/>
                    <FormattedMessage defaultMessage='When a run starts'/>
                </StyledSectionTitle>
                <Setting id={'create-channel'}>
                    <CreateAChannel
                        playbook={playbookForCreateChannel}
                        setPlaybook={setPlaybookForCreateChannel}
                    />
                </Setting>
                <Setting id={'invite-users'}>
                    <InviteUsers
                        disabled={archived}
                        enabled={playbook.invite_users_enabled}
                        onToggle={handleToggleInviteUsers}
                        searchProfiles={searchUsers}
                        getProfiles={getUsers}
                        userIds={playbook.invited_user_ids}
                        onAddUser={handleAddUserInvited}
                        onRemoveUser={handleRemoveUserInvited}
                    />
                </Setting>
                <Setting id={'assign-owner'}>
                    <AutoAssignOwner
                        disabled={archived}
                        enabled={playbook.default_owner_enabled}
                        onToggle={handleToggleDefaultOwner}
                        searchProfiles={searchUsers}
                        getProfiles={getUsers}
                        ownerID={playbook.default_owner_id}
                        onAssignOwner={handleAssignDefaultOwner}
                    />
                </Setting>
                <Setting id={'playbook-run-creation__outgoing-webhook'}>
                    <WebhookSetting
                        disabled={archived}
                        enabled={playbook.webhook_on_creation_enabled}
                        onToggle={handleToggleWebhookOnCreation}
                        input={playbook.webhook_on_creation_urls.join('\n')}
                        onBlur={handleWebhookOnCreationChange}
                        pattern={'https?://.*'}
                        delimiter={'\n'}
                        maxLength={1000}
                        rows={3}
                        placeholderText={formatMessage({defaultMessage: 'Enter webhook'})}
                        textOnToggle={formatMessage({defaultMessage: 'Send outgoing webhook (One per line)'})}
                        errorText={formatMessage({defaultMessage: 'Invalid webhook URLs'})}
                        maxRows={64}
                        maxErrorText={formatMessage({defaultMessage: 'Invalid entry: the maximum number of webhooks allowed is 64'})}
                    />
                </Setting>
            </StyledSection>
            <StyledSection>
                <StyledSectionTitle>
                    <Icon
                        path={mdiAccountCheckOutline}
                        size={1.75}
                    />
                    <FormattedMessage defaultMessage='When a new member joins the channel'/>
                </StyledSectionTitle>
                <Setting id={'user-joins-message'}>
                    <AutomationTitle>
                        <Toggle
                            disabled={archived}
                            isChecked={playbook.message_on_join_enabled}
                            onChange={() => {
                                updatePlaybook({
                                    messageOnJoinEnabled: !playbook.message_on_join_enabled,
                                });
                            }}
                        />
                        <div><FormattedMessage defaultMessage='Send a welcome message'/></div>
                    </AutomationTitle>
                    <MarkdownEdit
                        placeholder={formatMessage({defaultMessage: 'Send a welcome message…'})}
                        value={playbook.message_on_join}
                        disabled={!playbook.message_on_join_enabled || archived}
                        onSave={(messageOnJoin) => {
                            updatePlaybook({
                                messageOnJoin,
                                messageOnJoinEnabled: Boolean(messageOnJoin.trim()),
                            });
                        }}
                    />
                </Setting>
                <Setting id={'user-joins-channel-categorize'}>
                    <CategorizePlaybookRun
                        disabled={archived}
                        enabled={playbook.categorize_channel_enabled}
                        onToggle={handleToggleCategorizePlaybookRun}
                        categoryName={playbook.category_name}
                        onCategorySelected={handleCategoryNameChange}
                    />
                </Setting>
            </StyledSection>
        </>
    );
};

export default LegacyActionsEdit;

const StyledSection = styled(Section)`
    border: 1px solid rgba(var(--center-channel-color-rgb), 0.08);
    padding: 2rem;
    padding-bottom: 0;
    margin: 0;
    margin-bottom: 20px;
    border-radius: 8px;
`;

const StyledSectionTitle = styled(SectionTitle)`
    font-weight: 600;
    margin: 0 0 24px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    svg {
        color: rgba(var(--center-channel-color-rgb), 0.48);
    }
`;

const Setting = styled.div`
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

