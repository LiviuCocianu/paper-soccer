function InputField(props) {
    return (
        <div className="relative w-full h-full">
            <div className="absolute w-full h-full translate-x-1 translate-y-1 bg-black dark:bg-dark" />
            <input className="relative w-full p-2 border border-black dark:border-dark dark:bg-nightsky focus:outline-0 font-heycomic" type="text" {...props} spellCheck={false} />
        </div>
    )
}

export default InputField