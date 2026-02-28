import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.ornamentLeft} />
      <h1 className={styles.title}>
        <span className={styles.chinese}>牛牛</span>
        <span className={styles.english}>Calculator</span>
      </h1>
      <div className={styles.ornamentRight} />
    </header>
  );
}
