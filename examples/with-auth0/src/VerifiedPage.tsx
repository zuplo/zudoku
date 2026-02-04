import { Button } from "zudoku/components";
import { useVerifiedEmail } from "zudoku/hooks";

const VerifiedPage = () => {
  const { isVerified, refresh } = useVerifiedEmail();

  return (
    <div>
      Verified: {isVerified ? "Yes" : "No"}{" "}
      <Button onClick={() => void refresh()}>Refresh</Button>
    </div>
  );
};

export default VerifiedPage;
