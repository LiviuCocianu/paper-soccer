import LoadingIcon from "../assets/icons/LoadingIcon"

function SubmitButton({ text, loadingColors="", ...props }) {
	return <button type="submit" className="self-center px-16 py-2 mt-10 text-lg text-white duration-500 bg-black rounded-lg font-heycomic dark:bg-dark dark:text-black hover:transition-colors hover:bg-gray-900 hover:dark:bg-gray-400 disabled:bg-gray-900 disabled:dark:bg-gray-400 disabled:cursor-not-allowed" {...props}>
		<div className="flex space-x-2">
			{props.disabled ? <LoadingIcon className={`w-[1rem] ${loadingColors}`} /> : <></>}
			<span>{text}</span>
		</div>
	</button>
}

export default SubmitButton