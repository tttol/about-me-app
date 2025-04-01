import * as packageJson from "@/package.json";
import React from "react";

const Version: React.FC = () => {
  return (
    <div>
      <p className="text-right text-slate-500">version: {packageJson.version}</p>
    </div>
  );
};

export default Version;