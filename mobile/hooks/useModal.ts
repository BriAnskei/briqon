import { useState } from "react";

const useModal = () => {
	const [isOpen, setIsOpen] = useState(false);

	return {
		isOpen,
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
		toggle: () => setIsOpen((prev) => !prev),
	};
};

export default useModal;
