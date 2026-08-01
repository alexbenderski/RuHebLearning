import React from 'react';
import Navbar from './Navbar';
import type { UserProfile } from '../../types';
import styles from './Layout.module.css';

interface LayoutProps {
  userProfile: UserProfile | null;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ userProfile, children }) => (
  <div className={styles.layout}>
    <Navbar userProfile={userProfile} />
    <main className={styles.main}>{children}</main>
  </div>
);

export default Layout;
