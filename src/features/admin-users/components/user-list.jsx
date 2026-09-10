'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { pixel, proportional, useTableRowExpansion } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { createRowExpansionInteractionPlugin } from '@/shared/components/expandable-row-styles.jsx';

import {
  useCompaniesQuery,
  useDepartmentsQuery,
  usePositionsQuery,
} from '../hooks/use-org-directory.js';
import { useUsersQuery } from '../hooks/use-users-query.js';
import { ResetPasswordDialog } from './reset-password-dialog.jsx';
import { UserExpandedDetails } from './user-expanded-details.jsx';
import { UserFormDialog } from './user-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const BASE_SEARCH_FIELD_DEFS = [
  { key: 'fullName', type: 'string', label: 'Tên' },
  { key: 'nationalId', type: 'string', label: 'CCCD' },
  { key: 'phone', type: 'string', label: 'Số điện thoại' },
  { key: 'employeeCode', type: 'string', label: 'Mã nhân viên' },
];

const COLUMN_OPTIONS = [
  { key: 'name', label: 'Tên', isAlwaysVisible: true },
  { key: 'employeeCode', label: 'Mã nhân viên' },
  { key: 'company', label: 'Tên đơn vị' },
  { key: 'position', label: 'Chức vụ' },
  { key: 'department', label: 'Phòng ban' },
  { key: 'actions', label: 'Chức năng', isAlwaysVisible: true },
];
const ALL_COLUMN_KEYS = COLUMN_OPTIONS.map((column) => column.key);

const SKELETON_ROW_COUNT = 6;

/**
 * Placeholder rows shown while the page loads. `Table` infers its row type
 * from `data`, so these have to be full `UserListItem`s even though the
 * skeleton columns ignore every field but `id` — a bare `{ id }` makes the
 * two branches of the ternary disagree.
 * @type {import('../types/index.js').UserListItem[]}
 */
const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  id: `skeleton-${index}`,
  firstName: '',
  lastName: '',
  nationalId: '',
  employeeCode: '',
  phone: null,
  positionId: null,
  companyId: null,
  branchId: null,
  departmentIds: [],
  isAdmin: false,
}));
const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = ['20', '50', '100'];

/**
 * Builds an id → name lookup so the table can render human-readable
 * Company/Department/Position names instead of raw GUIDs. Branch name is
 * deliberately not shown as a column: there's no "list all branches"
 * endpoint (only "list branches of one company"), so showing it here would
 * mean an extra fetch per distinct company in the list — Department name
 * already narrows the workplace down enough for a list view; the full
 * Company → Branch → Department chain is still visible/editable in the
 * edit dialog.
 * @param {Array<{ id: string, name: string }>} items
 */
function toNameById(items) {
  return new Map(items.map((item) => [item.id, item.name]));
}

export function UserList() {
  const companiesQuery = useCompaniesQuery();
  const departmentsQuery = useDepartmentsQuery();
  const positionsQuery = usePositionsQuery();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // `UserFormDialog` stays mounted (not gated on `isCreateOpen`) once opened
  // so the Dialog can animate closed instead of vanishing — but never
  // mounted before the first open. Astryx's Calendar (inside the form's
  // "Ngày cấp CCCD" DateInput) formats its month label via
  // `Intl.DateTimeFormat(undefined, ...)`, which resolves to the runtime's
  // default locale: Node's server locale vs. the browser's — these differ
  // for a Vietnamese-locale browser, causing a hydration mismatch
  // ("August 2026" vs. "tháng 8 năm 2026") if the form is part of the
  // initial server-rendered HTML. Deferring its first mount to a client
  // click sidesteps that entirely: it never exists in the SSR'd tree.
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(
    /** @type {import('../types/index.js').UserListItem | null} */ (null),
  );
  const [resettingPasswordUser, setResettingPasswordUser] = useState(
    /** @type {import('../types/index.js').UserListItem | null} */ (null),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState(
    /** @type {string | null} */ (null),
  );

  const usersQuery = useUsersQuery({ page: pageIndex, pageSize });

  const companyOptions = (companiesQuery.data ?? []).map((company) => ({
    value: company.id,
    label: company.name,
  }));
  const departmentOptions = (departmentsQuery.data ?? []).map(
    (department) => ({ value: department.id, label: department.name }),
  );
  const companyNameById = toNameById(companiesQuery.data ?? []);
  const departmentNameById = toNameById(departmentsQuery.data ?? []);
  const positionNameById = toNameById(positionsQuery.data ?? []);

  const listResult = usersQuery.data;
  const users = listResult?.success ? listResult.users : [];

  /** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
  const searchFieldDefs = [
    ...BASE_SEARCH_FIELD_DEFS,
    {
      key: 'companyId',
      type: 'enum',
      label: 'Đơn vị',
      enumValues: companyOptions,
    },
    {
      key: 'departmentIds',
      type: 'enum_list',
      label: 'Phòng ban',
      enumValues: departmentOptions,
    },
  ];

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').UserListItem & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'name',
      header: 'Tên',
      width: proportional(1.6),
      filter: 'fullName',
      renderCell: (user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        return (
          <HStack gap={2} vAlign="center">
            <Avatar size="sm" name={fullName} tooltip={false} />
            <Text>{fullName}</Text>
          </HStack>
        );
      },
    },
    {
      key: 'employeeCode',
      header: 'Mã nhân viên',
      width: proportional(1),
      filter: 'employeeCode',
      renderCell: (user) => user.employeeCode || '—',
    },
    {
      key: 'company',
      header: 'Tên đơn vị',
      width: proportional(1.6),
      filter: 'companyId',
      renderCell: (user) =>
        (user.companyId && companyNameById.get(user.companyId)) ?? '—',
    },
    {
      key: 'position',
      header: 'Chức vụ',
      width: proportional(1.2),
      renderCell: (user) =>
        (user.positionId && positionNameById.get(user.positionId)) ?? '—',
    },
    {
      key: 'department',
      header: 'Phòng ban',
      width: proportional(1.3),
      filter: 'departmentIds',
      renderCell: (user) =>
        departmentNameById.get(user.departmentIds[0] ?? '') ?? '—',
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(130),
      align: 'end',
      // Row-click-to-expand (see `rowInteractionPlugin` below) listens on
      // the whole row, so this cell stops the click from bubbling there too
      // — otherwise picking "Sửa"/"Đặt lại mật khẩu" also toggles the row.
      renderCell: (user) => (
        <HStack onClick={(event) => event.stopPropagation()}>
          <DropdownMenu
            button={{ label: 'Thao tác', variant: 'ghost', size: 'sm' }}
            alignment="end"
            items={[
              { label: 'Sửa', onClick: () => setEditingUser(user) },
              {
                label: 'Đặt lại mật khẩu',
                onClick: () => setResettingPasswordUser(user),
              },
            ]}
          />
        </HStack>
      ),
    },
  ];

  const expandedKeys = useMemo(
    () => new Set(expandedUserId ? [expandedUserId] : []),
    [expandedUserId],
  );
  const expansionPlugin =
    /** @type {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').UserListItem & Record<string, unknown>>} */ (
      useTableRowExpansion({
        expandedKeys,
        onToggle: (userId) =>
          setExpandedUserId((current) => (current === userId ? null : userId)),
        getRowKey: (user) => user.id,
        getIsItemExpandable: (user) => !user.id.startsWith('skeleton-'),
        renderExpanded: (user) => (
          <UserExpandedDetails
            user={user}
            onEdit={setEditingUser}
            onResetPassword={setResettingPasswordUser}
            companyNameById={companyNameById}
            departmentNameById={departmentNameById}
            positionNameById={positionNameById}
          />
        ),
      })
    );
  const rowInteractionPlugin = useMemo(
    /** @returns {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').UserListItem & Record<string, unknown>>} */
    () =>
      createRowExpansionInteractionPlugin({
        expandedId: expandedUserId,
        onToggle: (userId) =>
          setExpandedUserId((current) => (current === userId ? null : userId)),
        isExpandable: (user) => !user.id.startsWith('skeleton-'),
      }),
    [expandedUserId],
  );

  // Search filters the page currently on screen, not the whole table: the
  // endpoint is paginated server-side and has no search parameter yet.
  const searchableUsers = users.map((user) => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    phone: user.phone ?? '',
  }));

  const totalUsers = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  return (
    <VStack gap={4} hAlign="stretch">
      <VStack gap={1}>
        <Heading level={1}>Người dùng</Heading>
        <Text color="secondary">
          Danh sách toàn bộ người dùng trong hệ thống.
        </Text>
      </VStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <AdvanceTable
        toolbarLabel="Thao tác danh sách người dùng"
        searchFieldDefs={searchFieldDefs}
        entityLabel="Người dùng"
        contentSearchFieldKey="fullName"
        searchPlaceholder="Tìm tên, CCCD..."
        columnOptions={COLUMN_OPTIONS}
        initialColumnKeys={ALL_COLUMN_KEYS}
        defaultColumnKeys={ALL_COLUMN_KEYS}
        tableColumns={columns}
        data={searchableUsers}
        idKey="id"
        isLoading={usersQuery.isLoading}
        skeletonRows={skeletonRows}
        extraPlugins={{
          expansion: expansionPlugin,
          rowInteraction: rowInteractionPlugin,
        }}
        primaryAction={{
          label: 'Thêm',
          onClick: () => {
            setHasOpenedCreate(true);
            setIsCreateOpen(true);
          },
        }}
        onRefresh={() => usersQuery.refetch()}
        isRefreshing={usersQuery.isFetching}
        pagination={{
          pageIndex,
          pageSize,
          totalCount: totalUsers,
          totalPages,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: setPageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />

      {hasOpenedCreate ? (
        // No `onSuccess` here (unlike the edit dialog below): closing
        // immediately on success would take the CCCD/mật khẩu confirmation
        // in `submitSuccess` down with it before the Admin ever reads it —
        // the whole reason that message exists. The Admin closes manually
        // once they've copied it.
        <UserFormDialog
          mode="create"
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      ) : null}

      {editingUser ? (
        <UserFormDialog
          mode="edit"
          key={editingUser.id}
          isOpen={editingUser !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingUser(null);
          }}
          user={editingUser}
          onSuccess={() => setEditingUser(null)}
        />
      ) : null}

      {resettingPasswordUser ? (
        <ResetPasswordDialog
          key={resettingPasswordUser.id}
          isOpen={resettingPasswordUser !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setResettingPasswordUser(null);
          }}
          user={resettingPasswordUser}
        />
      ) : null}
    </VStack>
  );
}
