import InputField from "../InputField"

function NameField(props) {
	return (
		<InputField placeholder="Username (optional)" maxLength={16} pattern="[\w\s]+" {...props} />
	)
}

export default NameField