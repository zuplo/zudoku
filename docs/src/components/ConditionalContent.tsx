/**
 * Used to conditionally render content based on the platform.
 */
const ConditionalContent = ({
  mode,
  children,
}: {
  mode: "opensource" | "zuplo";
  children: React.ReactNode;
}) => {
  if (mode === "opensource") {
    return <>{children}</>;
  }
  return null;
};

export default ConditionalContent;
