import { cn } from "zudoku";
import { BentoBox, BentoDescription, BentoImage } from "./Bento";
import { Box } from "./Box";

const AuthCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Box
      className={cn(
        "rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex-shrink-0",
        className,
      )}
    >
      {children}
    </Box>
  );
};

export const BentoAuthReady = () => {
  return (
    <BentoBox className="col-span-full md:col-span-6 lg:col-span-7 group">
      <BentoImage className="flex items-center justify-center">
        <div className="flex w-full justify-around">
          <AuthCard className="bg-[#B6A0FB] rotate-14 group-hover:-rotate-14 transition-all duration-300 ease-in-out group-hover:translate-x-0 translate-x-9">
            <img src="/auth/clerk.svg" alt="Clerk" className="w-12 h-12" />
          </AuthCard>
          <AuthCard className="bg-[#FF02BD] -rotate-10 group-hover:rotate-10 transition-all duration-300 ease-in-out group-hover:translate-x-0 translate-x-3">
            <img
              src="/auth/firebase.svg"
              alt="Firebase"
              className="w-12 h-12"
            />
          </AuthCard>
          <AuthCard className="bg-[#FEA9FC] rotate-10 group-hover:-rotate-10 transition-all duration-300 ease-in-out group-hover:translate-x-0 -translate-x-3">
            <img src="/auth/yo.svg" alt="Yoga" className="w-12 h-12" />
          </AuthCard>
          <AuthCard className="bg-[#5A4FC0] -rotate-14 group-hover:rotate-14 transition-all duration-300 ease-in-out group-hover:translate-x-0 -translate-x-9">
            <img
              src="/auth/supabase.svg"
              alt="Supabase"
              className="w-12 h-12"
            />
          </AuthCard>
        </div>
      </BentoImage>
      <BentoDescription
        title="Auth Ready"
        description="Built-in authentication and authorization support for OAuth2, JWT, and more."
      />
    </BentoBox>
  );
};
