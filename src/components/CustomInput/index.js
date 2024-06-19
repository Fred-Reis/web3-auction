import "./style.css";

export const CustomInput = ({ type = "text", value, action, ...rest }) => {
  return (
    <input
      {...rest}
      className="input-container"
      type={type}
      value={value}
      onChange={action}
    />
  );
};
