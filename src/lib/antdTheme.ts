import { theme, type ThemeConfig } from "antd";

export const productionOperationsTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#34d399",
    colorSuccess: "#34d399",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorInfo: "#a78bfa",
    colorBgBase: "#0c1015",
    colorBgContainer: "#141a22",
    colorBgElevated: "#1c2430",
    colorBgLayout: "#0c1015",
    colorBorder: "rgba(255, 255, 255, 0.10)",
    colorBorderSecondary: "rgba(255, 255, 255, 0.06)",
    colorText: "rgba(255, 255, 255, 0.94)",
    colorTextSecondary: "rgba(255, 255, 255, 0.62)",
    colorTextTertiary: "rgba(255, 255, 255, 0.40)",
    borderRadius: 14,
    borderRadiusLG: 18,
    borderRadiusSM: 10,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    controlHeight: 48,
    controlHeightLG: 56,
    motionDurationFast: "0.15s",
    motionDurationMid: "0.22s",
    motionEaseInOut: "cubic-bezier(0.22, 1, 0.36, 1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.28)",
    boxShadowSecondary: "0 1px 2px rgba(0, 0, 0, 0.24)",
  },
  components: {
    Card: {
      paddingLG: 20,
      colorBgContainer: "#141a22",
      colorBorderSecondary: "rgba(255, 255, 255, 0.08)",
    },
    Button: {
      primaryShadow: "0 2px 0 rgba(0, 0, 0, 0.2)",
      defaultShadow: "none",
      fontWeight: 600,
    },
    Input: {
      colorBgContainer: "#141a22",
      activeBorderColor: "#34d399",
      hoverBorderColor: "rgba(255, 255, 255, 0.18)",
      activeShadow: "0 0 0 2px rgba(52, 211, 153, 0.15)",
    },
    Statistic: {
      titleFontSize: 10,
      contentFontSize: 26,
    },
    Alert: {
      borderRadiusLG: 14,
    },
    Divider: {
      colorSplit: "rgba(255, 255, 255, 0.08)",
    },
  },
};
