'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Heading } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';

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
              </VStack>

              {signedInElsewhereNotice ? (
                <Banner
                  status="warning"
                  title="Tài khoản đã được đăng nhập ở thiết bị khác. Nếu không phải bạn, hãy đổi mật khẩu ngay."
                  container="card"
                />
              ) : null}

              {sessionExpiredNotice ? (
                <Banner
                  status="warning"
                  title="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                  container="card"
                />
              ) : null}

              {sessionRevokedNotice ? (
                <Banner
                  status="warning"
                  title="Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại."
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
                placeholder="VD: 036097012975"
                type="text"
                size="lg"
                isRequired
                status={nationalIdStatus}
                statusVariant="tooltip"
              />

              <TextInput
                label="Mật khẩu"
                value={password}
                onChange={setPassword}
                placeholder="Nhập mật khẩu"
                type="password"
                size="lg"
                isRequired
                status={passwordStatus}
                statusVariant="tooltip"
              />

              <CheckboxInput
                label="Ghi nhớ đăng nhập"
                value={rememberMe}
                onChange={setRememberMe}
              />

              <Button
                label="Đăng nhập"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
              />
            </VStack>
          </form>
        </Card>
      </VStack>
    </Center>
  );
}
