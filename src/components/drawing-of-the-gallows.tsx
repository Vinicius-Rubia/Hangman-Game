import { BodyParts } from "./body-parts";

interface DrawingOfTheGallowsProps {
  mistakes: number;
}

export function DrawingOfTheGallows({ mistakes }: DrawingOfTheGallowsProps) {
  return (
    <div className="relative w-64 h-64 mb-8 flex justify-center items-center">
      <div className="absolute bottom-4 w-32 h-2 bg-white rounded" />
      <div className="absolute bottom-4 left-1/2 -translate-x-12 w-2 h-56 bg-white rounded" />
      <div className="absolute top-8 left-1/2 -translate-x-12 w-32 h-2 bg-white rounded" />
      <div className="absolute top-8 right-16 w-2 h-8 bg-white rounded" />
      <BodyParts mistakes={mistakes} />
    </div>
  );
}
