"use client";

import React, { createContext, useState } from "react";

const IsSideBarOpenContext = createContext([]);

const IsSideBarOpenProvider = ({ children }) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  return (
    <IsSideBarOpenContext.Provider
      value={{ isSideBarOpen, setIsSideBarOpen }}
    >
      {children}
    </IsSideBarOpenContext.Provider>
  );
};

export default IsSideBarOpenProvider;
export { IsSideBarOpenContext };
