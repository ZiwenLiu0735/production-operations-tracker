import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Typography } from "antd";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

const { Paragraph, Text, Title } = Typography;

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    const signInError = await signIn(email, password);
    setError(signInError);
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-900 px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <Text className="tt-section-label">Production Operations Tracker</Text>
          <Title level={1} style={{ margin: "12px 0 8px", fontSize: 34 }}>
            Sign in
          </Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Use the account provided by your administrator.
          </Paragraph>
        </div>

        <Card className="tt-surface-card tt-surface-card--elevated">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <Alert
                type="error"
                showIcon
                message="Unable to sign in"
                description={error}
              />
            )}

            <label className="flex flex-col gap-2">
              <span className="tt-section-label">Email</span>
              <Input
                size="large"
                type="email"
                autoComplete="email"
                prefix={<MailOutlined />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                disabled={submitting}
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="tt-section-label">Password</span>
              <Input.Password
                size="large"
                autoComplete="current-password"
                prefix={<LockOutlined />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                disabled={submitting}
                required
              />
            </label>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              disabled={!email.trim() || !password}
              block
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
