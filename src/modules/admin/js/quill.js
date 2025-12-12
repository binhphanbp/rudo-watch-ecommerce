export const quill = new Quill('#editor', {
	theme: 'snow',
	placeholder: 'Nhập nội dung bài viết...',
	modules: {
		toolbar: [
			['bold', 'italic', 'underline', 'strike'],
			['link', 'image', 'video'],
			[{ list: 'ordered' }, { list: 'bullet' }],
			[{ header: [1, 2, 3, false] }],
			[{ align: [] }],
			['clean']
		]
	}
});