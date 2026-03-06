const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <img
      src="/servicecms-transp.png"
      alt="Service CMS Logo"
      className={`h-8 ${className}`}
    />
  );
};

export default Logo;