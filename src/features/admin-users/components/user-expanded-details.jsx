'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import {
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core/MetadataList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { KeyRound, Pencil, ShieldMinus, ShieldPlus, UserRound } from 'lucide-react';
import { useState } from 'react';

import { expandableRowStyles } from '@/shared/components/expandable-row-styles.jsx';

import { labelForPermission } from '../config/grantable-permissions.js';
import { useAdminBankAccountsQuery } from '../hooks/use-admin-bank-accounts-query.js';
import {
  useGrantAdminRoleMutation,
  useRevokeAdminRoleMutation,
} from '../hooks/use-admin-role-mutation.js';
import { useInheritedPermissionsQuery } from '../hooks/use-inherited-permissions-query.js';
import {
  useBranchesQuery,
  useVietnamBanksQuery,
} from '../hooks/use-org-directory.js';
import { useUserDetailQuery } from '../hooks/use-user-detail-query.js';
import { UserPermissionsFields } from './user-permissions-fields.jsx';

/** @param {string | number | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : String(value);
}

/** @param {import('../types/index.js').Gender | null} gender */
function genderLabel(gender) {
  if (gender === 'Male') return 'Nam';
  if (gender === 'Female') return 'Nữ';
  if (gender === 'Other') return 'Khác';
  return '—';
}

/** @typedef {'info' | 'address' | 'permissions' | 'banks'} ExpandedTab */

/**
 * Row-expansion detail panel for `UserList` — same idiom as
 * `ContractExpandedDetails` (`contracts-list.jsx`): a tabbed read-only
 * summary that fetches its own per-row detail (`GET /users/{id}` and
 * friends) only once expanded, plus the row's real actions (reset
 * password, edit) in a footer instead of a separate dropdown.
 * @param {{
 *   user: import('../types/index.js').UserListItem,
 *   onEdit: (user: import('../types/index.js').UserListItem) => void,
 *   onResetPassword: (user: import('../types/index.js').UserListItem) => void,
 *   companyNameById: Map<string, string>,
 *   departmentNameById: Map<string, string>,
 *   positionNameById: Map<string, string>,
 * }} props
 */
export function UserExpandedDetails({
  user,
  onEdit,
  onResetPassword,
  companyNameById,
  departmentNameById,
  positionNameById,
}) {
  const [activeTab, setActiveTab] = useState(/** @type {ExpandedTab} */ ('info'));
  const [isConfirmingAdminChange, setIsConfirmingAdminChange] = useState(false);
  const [adminRoleError, setAdminRoleError] = useState('');

  const detailQuery = useUserDetailQuery(user.id);
  const grantAdminRoleMutation = useGrantAdminRoleMutation(user.id);
  const revokeAdminRoleMutation = useRevokeAdminRoleMutation(user.id);
  const adminRoleMutation = user.isAdmin
    ? revokeAdminRoleMutation
    : grantAdminRoleMutation;

  async function handleConfirmAdminRoleChange() {
    setAdminRoleError('');
    const result = await adminRoleMutation.mutateAsync();
    if (result.success) {
      setIsConfirmingAdminChange(false);
    } else {
      setAdminRoleError(result.message);
    }
  }
  const detail = detailQuery.data?.success ? detailQuery.data.user : null;
  const isLoadingDetail = !detailQuery.data?.success;

  const branchesQuery = useBranchesQuery(user.companyId ?? '');
  const branchName = (branchesQuery.data ?? []).find(
    (branch) => branch.id === user.branchId,
  )?.name;

  const bankAccountsQuery = useAdminBankAccountsQuery(user.id);
  const bankAccounts = bankAccountsQuery.data?.success
    ? bankAccountsQuery.data.bankAccounts
    : [];
  const vietnamBanksQuery = useVietnamBanksQuery();
  const vietnamBanksById = new Map(
    (vietnamBanksQuery.data ?? []).map((bank) => [bank.id, bank]),
  );

  const departmentId = user.departmentIds[0] ?? '';
  const inheritedPermissionsQuery = useInheritedPermissionsQuery(departmentId);
  const inheritedPermissions = inheritedPermissionsQuery.data ?? [];

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <VStack gap={4} hAlign="stretch" xstyle={expandableRowStyles.expandedPanel}>
      <HStack hAlign="between" vAlign="start" gap={4} wrap="wrap">
        <HStack gap={3} vAlign="center">
          <HStack
            vAlign="center"
            hAlign="center"
            xstyle={expandableRowStyles.expandedIcon}
          >
            <Icon icon={UserRound} size="md" />
          </HStack>
          <VStack gap={1}>
            <Heading level={3}>{fullName}</Heading>
            <Text color="secondary">
              {user.employeeCode || '—'}
              {user.companyId
                ? ` · ${companyNameById.get(user.companyId) ?? '—'}`
                : ''}
            </Text>
          </VStack>
        </HStack>
        <HStack gap={2} vAlign="center">
          {user.isAdmin ? <Token label="Admin" color="red" size="sm" /> : null}
          <Button
            label={user.isAdmin ? 'Thu hồi quyền Admin' : 'Cấp quyền Admin'}
            variant="secondary"
            size="sm"
            icon={<Icon icon={user.isAdmin ? ShieldMinus : ShieldPlus} />}
            onClick={() => {
              setAdminRoleError('');
              setIsConfirmingAdminChange(true);
            }}
          />
        </HStack>
      </HStack>

      {adminRoleError ? (
        <Banner status="error" title={adminRoleError} container="card" />
      ) : null}

      <TabList
        value={activeTab}
        onChange={(value) => setActiveTab(/** @type {ExpandedTab} */ (value))}
        hasDivider
        size="sm"
      >
        <Tab value="info" label="Thông tin" />
        <Tab value="address" label="Địa chỉ" />
        <Tab value="permissions" label="Quyền" />
        <Tab
          value="banks"
          label="Ngân hàng"
          endContent={
            bankAccounts.length > 0 ? String(bankAccounts.length) : undefined
          }
        />
      </TabList>

      {activeTab === 'info' &&
        (isLoadingDetail ? (
          <VStack gap={3} hAlign="stretch">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} height={16} width="60%" index={row} />
            ))}
          </VStack>
        ) : (
          <MetadataList columns={4} label={{ position: 'top' }}>
            <MetadataListItem label="Họ tên">{fullName}</MetadataListItem>
            <MetadataListItem label="Mã nhân viên">
              {orDash(user.employeeCode)}
            </MetadataListItem>
            <MetadataListItem label="Số CCCD">
              {orDash(user.nationalId)}
            </MetadataListItem>
            <MetadataListItem label="Số điện thoại">
              {orDash(user.phone)}
            </MetadataListItem>
            <MetadataListItem label="Năm sinh">
              {orDash(detail?.yearOfBirth)}
            </MetadataListItem>
            <MetadataListItem label="Giới tính">
              {genderLabel(detail?.gender ?? null)}
            </MetadataListItem>
            <MetadataListItem label="Ngày cấp CCCD">
              {orDash(detail?.nationalIdIssueDate)}
            </MetadataListItem>
            <MetadataListItem label="Nơi cấp CCCD">
              {orDash(detail?.nationalIdIssuePlace)}
            </MetadataListItem>
            <MetadataListItem label="Số hộ chiếu">
              {orDash(detail?.passportNumber)}
            </MetadataListItem>
            <MetadataListItem label="Công ty">
              {orDash(user.companyId && companyNameById.get(user.companyId))}
            </MetadataListItem>
            <MetadataListItem label="Chi nhánh">
              {orDash(branchName)}
            </MetadataListItem>
            <MetadataListItem label="Phòng ban">
              {orDash(departmentNameById.get(departmentId))}
            </MetadataListItem>
            <MetadataListItem label="Chức vụ">
              {orDash(
                user.positionId && positionNameById.get(user.positionId),
              )}
            </MetadataListItem>
          </MetadataList>
        ))}

      {activeTab === 'address' &&
        (isLoadingDetail ? (
          <VStack gap={3} hAlign="stretch">
            {[0, 1].map((row) => (
              <Skeleton key={row} height={16} width="60%" index={row} />
            ))}
          </VStack>
        ) : (
          <VStack gap={4} hAlign="stretch">
            <MetadataList
              title="Địa chỉ theo chuẩn cũ (trước sáp nhập)"
              columns={4}
              label={{ position: 'top' }}
            >
              <MetadataListItem label="Tỉnh/Thành phố">
                {orDash(detail?.oldProvince)}
              </MetadataListItem>
              <MetadataListItem label="Quận/Huyện">
                {orDash(detail?.oldDistrict)}
              </MetadataListItem>
              <MetadataListItem label="Phường/Xã">
                {orDash(detail?.oldWard)}
              </MetadataListItem>
              <MetadataListItem label="Địa chỉ chi tiết">
                {orDash(detail?.oldAddressDetail)}
              </MetadataListItem>
            </MetadataList>
            <MetadataList
              title="Địa chỉ theo chuẩn mới (sau sáp nhập)"
              columns={4}
              label={{ position: 'top' }}
            >
              <MetadataListItem label="Tỉnh/Thành phố">
                {orDash(detail?.newProvince)}
              </MetadataListItem>
              <MetadataListItem label="Phường/Xã">
                {orDash(detail?.newWard)}
              </MetadataListItem>
              <MetadataListItem label="Địa chỉ chi tiết">
                {orDash(detail?.newAddressDetail)}
              </MetadataListItem>
            </MetadataList>
          </VStack>
        ))}

      {activeTab === 'permissions' && (
        <VStack gap={5} hAlign="stretch">
          <VStack gap={3} hAlign="stretch">
            <Text type="large" weight="semibold">
              Quyền kế thừa từ phòng ban
            </Text>
            {!departmentId ? (
              <Text color="secondary">
                Người dùng chưa thuộc phòng ban nào.
              </Text>
            ) : inheritedPermissionsQuery.isLoading ? (
              <Skeleton height={16} width="60%" />
            ) : inheritedPermissions.length > 0 ? (
              <List hasDividers density="compact">
                {inheritedPermissions.map((permission) => {
                  const { label, description } = labelForPermission(
                    permission.key,
                    permission.description,
                  );
                  return (
                    <ListItem
                      key={`${permission.key}-${permission.scopeId}`}
                      label={label}
                      description={
                        description
                          ? `${description} · Phạm vi chi nhánh`
                          : 'Phạm vi chi nhánh'
                      }
                    />
                  );
                })}
              </List>
            ) : (
              <Text color="secondary">
                Phòng ban này không cấp quyền kế thừa.
              </Text>
            )}
          </VStack>

          <Divider />

          <VStack gap={3} hAlign="stretch">
            <Text type="large" weight="semibold">
              Quyền cấp riêng
            </Text>
            <UserPermissionsFields
              userId={user.id}
              extraPermissions={detail?.extraPermissions ?? []}
              isLoading={isLoadingDetail}
            />
          </VStack>
        </VStack>
      )}

      {activeTab === 'banks' &&
        (bankAccountsQuery.isLoading ? (
          <Skeleton height={16} width="60%" />
        ) : bankAccounts.length === 0 ? (
          <Text color="secondary">Chưa có tài khoản ngân hàng</Text>
        ) : (
          <List hasDividers density="compact">
            {bankAccounts.map((account) => {
              const bank = vietnamBanksById.get(account.vietnamBankId);
              return (
                <ListItem
                  key={account.id}
                  label={`${bank?.shortName ?? bank?.name ?? account.vietnamBankId}${account.isPrimary ? ' · Chính' : ''}`}
                  description={[account.accountNumber, account.branch]
                    .filter(Boolean)
                    .join(' · ')}
                />
              );
            })}
          </List>
        ))}

      <Divider />

      <HStack hAlign="end" gap={2}>
        <Button
          label="Đặt lại mật khẩu"
          variant="secondary"
          size="sm"
          icon={<Icon icon={KeyRound} />}
          onClick={() => onResetPassword(user)}
        />
        <Button
          label="Sửa"
          variant="primary"
          size="sm"
          icon={<Icon icon={Pencil} />}
          onClick={() => onEdit(user)}
        />
      </HStack>

      <AlertDialog
        isOpen={isConfirmingAdminChange}
        onOpenChange={setIsConfirmingAdminChange}
        title={
          user.isAdmin
            ? `Thu hồi quyền Admin của "${fullName}"?`
            : `Cấp quyền Admin cho "${fullName}"?`
        }
        description={
          user.isAdmin
            ? 'Người này sẽ mất toàn bộ quyền Admin (bao gồm quản lý người dùng, phòng ban, và mọi dữ liệu hệ thống) ngay lập tức. Phiên đăng nhập hiện tại của họ sẽ bị vô hiệu.'
            : 'Người này sẽ có toàn quyền truy cập hệ thống — quản lý người dùng, phòng ban, và mọi dữ liệu, kể cả dữ liệu private của hợp đồng. Chỉ cấp cho người thực sự tin cậy.'
        }
        actionLabel={user.isAdmin ? 'Thu hồi' : 'Cấp quyền'}
        isActionLoading={adminRoleMutation.isPending}
        onAction={handleConfirmAdminRoleChange}
      />
    </VStack>
  );
}
