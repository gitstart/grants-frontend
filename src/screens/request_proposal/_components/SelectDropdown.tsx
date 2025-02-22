import { Select, SingleValue, } from 'chakra-react-select'

interface Props<T> {
    options: T[]
	value?: SingleValue<T>
    onChange: (value: SingleValue<T>) => void
    placeholder?: string
}

function SelectDropdown<T>({ options, placeholder, value, onChange }: Props<T>) {
	return (
		<Select<T>
			variant='flushed'
			options={options}
			placeholder={placeholder}
			selectedOptionStyle='check'
			onChange={onChange}
			value={value}
			chakraStyles={
				{
					container: (provided) => ({
						...provided,
						width: '30%',
						fontSize: '96px',
						fontWeight: '400',
						color: 'black.1'
					}),
					valueContainer: (provided) => ({
						...provided,
						fontSize: '20px',
					}),
					menu: (provided) => ({
						...provided,
						fontSize: '24px',
						fontWeight: '400',
					})
				}
			}
			 />
	)
}

export default SelectDropdown