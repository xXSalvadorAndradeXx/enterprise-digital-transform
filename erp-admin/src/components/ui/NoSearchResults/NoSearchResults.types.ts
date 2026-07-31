import { ReactNode } from "react";

export interface NoSearchResultsProps {
  image: ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}