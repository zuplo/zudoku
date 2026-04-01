import { Card, CardContent, CardHeader } from "zudoku/ui/Card";
import { Skeleton } from "zudoku/ui/Skeleton";

export const SubscriptionsPageSkeleton = () => (
  <div className="w-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
    <div className="max-w-4xl space-y-8">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-16" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-48" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  </div>
);
