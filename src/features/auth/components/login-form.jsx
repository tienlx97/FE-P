'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { TextInput } from '@/shared/components/text-input.jsx';

import { useLoginForm } from '../hooks/use-login-form.js';

export function LoginForm() {
  const {
    nationalId,
    setNationalId,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    nationalIdStatus,
    passwordStatus,
    submitError,
    sessionExpiredNotice,
    signedInElsewhereNotice,
    sessionRevokedNotice,
    isSubmitting,
    handleSubmit,
  } = useLoginForm();

  return (
    <Center axis="both" paddingBlock={10} paddingInline={4}>
      <VStack gap={4} hAlign="stretch" width="100%" maxWidth={400}>
        <Card padding={8}>
          <form onSubmit={handleSubmit}>
            <VStack gap={4} hAlign="stretch">
              <VStack gap={1} hAlign="center">
                <Heading level={2}>ĐĂNG NHẬP</Heading>
                <Text color="secondary">
                  Đăng nhập bằng CCCD và mật khẩu của bạn.
                </Text>
              </VStack>

              {signedInElsewhereNotice ? (
                <Banner
                  status="warning"
                  title="Đã đăng nhập trên thiết bị khác"
                  description="Phiên trên thiết bị này đã kết thúc. Nếu không phải bạn đăng nhập, hãy liên hệ quản trị viên và đổi mật khẩu."
                  container="card"
                />
              ) : null}

              {sessionExpiredNotice &&
              !signedInElsewhereNotice &&
              !sessionRevokedNotice ? (
                <Banner
                  status="warning"
                  title="Phiên đăng nhập đã hết hạn"
                  description="Vui lòng đăng nhập lại để tiếp tục công việc."
                  container="card"
                />
              ) : null}

              {sessionRevokedNotice && !signedInElsewhereNotice ? (
                <Banner
                  status="warning"
                  title="Phiên đăng nhập đã kết thúc"
                  description="Phiên có thể đã được đăng xuất hoặc thu hồi do thay đổi mật khẩu, quyền truy cập. Vui lòng đăng nhập lại."
                  container="card"
                />
              ) : null}

              {submitError ? (
                <Banner status="error" title={submitError} container="card" />
              ) : null}

              <TextInput
                label="Số CCCD"
                value={nationalId}
                onChange={setNationalId}
                placeholder="Nhập 12 chữ số CCCD"
                type="text"
                autoComplete="username"
                htmlName="nationalId"
                size="lg"
                isRequired
                status={nationalIdStatus}
              />

              <TextInput
                label="Mật khẩu"
                value={password}
                onChange={setPassword}
                placeholder="Nhập mật khẩu"
                type="password"
                autoComplete="current-password"
                htmlName="password"
                size="lg"
                isRequired
                status={passwordStatus}
              />

              <CheckboxInput
                label="Ghi nhớ số CCCD trên thiết bị này"
                description="Chỉ lưu số CCCD để điền lần sau, không lưu mật khẩu."
                value={rememberMe}
                onChange={setRememberMe}
              />

              <Button
                label="Đăng nhập"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
              />
            </VStack>
          </form>
        </Card>
      </VStack>
    </Center>
  );
}
