import React from "react";
import Card from './Card';

const FileDownloadCard = ({title, url, filename, type}) => (
  <Card title={title || "File Download"}>
    <a target="_blank" download href={url}>{filename || "Download"}</a>
  </Card>
);

export default FileDownloadCard;
