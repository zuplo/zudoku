import type { ReactNode } from "react";
import { ErrorPage } from "./ErrorPage.js";

type StatusPageProps = {
  statusCode: number;
  message?: ReactNode;
};

const getDefaultContent = (
  statusCode: number,
): { title: string; message: string } => {
  switch (statusCode) {
    case 400:
      return {
        title: "Bad Request",
        message:
          "The request could not be understood by the server due to malformed syntax.",
      };
    case 403:
      return {
        title: "Forbidden",
        message: "You don't have permission to access this resource.",
      };
    case 404:
      return {
        title: "Not Found",
        message: "The requested resource could not be found.",
      };
    case 405:
      return {
        title: "Method Not Allowed",
        message:
          "The request method is not supported for the requested resource.",
      };
    case 414:
      return {
        title: "Request URI Too Large",
        message: "The request URI is too large.",
      };
    case 416:
      return {
        title: "Range Not Satisfiable",
        message: "The server cannot satisfy the request range.",
      };
    case 500:
      return {
        title: "Internal Server Error",
        message: "An unexpected error occurred while processing your request.",
      };
    case 501:
      return {
        title: "Not Implemented",
        message:
          "The server does not support the functionality required to fulfill the request.",
      };
    case 502:
      return {
        title: "Bad Gateway",
        message:
          "The server received an invalid response from the upstream server.",
      };
    case 503:
      return {
        title: "Service Unavailable",
        message: "The server is temporarily unable to handle the request.",
      };
    case 504:
      return {
        title: "Gateway Timeout",
        message:
          "The server did not receive a timely response from the upstream server.",
      };
    default:
      return {
        title: "An error occurred",
        message: "Something went wrong while processing your request.",
      };
  }
};

export const StatusPage = ({ statusCode, message }: StatusPageProps) => {
  const defaultContent = getDefaultContent(statusCode);

  return (
    <ErrorPage
      title={defaultContent.title}
      message={message ?? defaultContent.message}
      category={statusCode}
    />
  );
};
