import { Button } from "zudoku/components";
import { useVerifiedEmail } from "../../../packages/zudoku/src/lib/authentication/hook";

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
