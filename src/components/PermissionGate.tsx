import React from 'react';

type PermissionGateProps = {
  allowed: boolean;
  children: React.ReactNode;
};

const PermissionGate: React.FC<PermissionGateProps> = ({ allowed, children }) => {
  if (!allowed) return null;
  return <>{children}</>;
};

export default PermissionGate; 