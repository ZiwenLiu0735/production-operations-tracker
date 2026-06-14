import { Button, Card, Typography } from "antd";
import { useAuth } from "../context/AuthContext";

const { Paragraph, Text, Title } = Typography;

interface AccountStatusPageProps {
  mode: "setup" | "operator";
}

export function AccountStatusPage({ mode }: AccountStatusPageProps) {
  const { employee, identityError, profile, signOut, user } = useAuth();
  const isOperator = mode === "operator";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-900 px-5 py-10 text-white">
      <Card className="tt-surface-card tt-surface-card--elevated w-full max-w-lg text-center">
        <Text className="tt-section-label">
          {isOperator ? "Employee Account" : "Account Setup Required"}
        </Text>
        <Title level={2} style={{ margin: "12px 0 8px" }}>
          {isOperator
            ? `Welcome, ${employee?.preferredName ?? employee?.legalName ?? profile?.displayName}`
            : "Your account is not ready yet"}
        </Title>
        <Paragraph type="secondary">
          {isOperator
            ? "Personal session and production history will be connected in the next migration phase."
            : identityError ??
              "An administrator must link this login to an active employee record before you can use the application."}
        </Paragraph>
        <Paragraph type="secondary">
          Signed in as {user?.email}
        </Paragraph>
        <Button size="large" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </Card>
    </main>
  );
}
