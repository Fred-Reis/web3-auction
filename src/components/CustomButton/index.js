import "./style.css";

export const CustomButton = ({ type = "default", title, action, ...rest }) => {
  return (
    <button
      {...rest}
      className={type === "connect" ? "connect-cta" : "button"}
      onClick={action}
    >
      {title}
    </button>
  );
};
