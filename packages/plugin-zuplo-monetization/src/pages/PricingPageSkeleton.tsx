import { Card, CardContent, CardHeader } from "zudoku/ui/Card";
import { Skeleton } from "zudoku/ui/Skeleton";

export const PricingPageSkeleton = () => (
  <div className="w-full px-4 pt-(--padding-content-top) pb-(--padding-content-bottom)">
    <div className="text-center space-y-4 mb-12">
      <Skeleton className="h-9 w-48 mx-auto" />
      <Skeleton className="h-5 w-96 mx-auto" />
    </div>
    <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,max-content))] justify-center gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="w-[300px]">
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
