AMATL_VERSION := 0.19.0

amatl:
	mkdir -p tmp
	curl -kL --output tmp/amatl.tar.gz https://github.com/Bornholm/amatl/releases/download/v$(AMATL_VERSION)/amatl_$(AMATL_VERSION)_linux_amd64.tar.gz
	( cd tmp && tar -xzf amatl.tar.gz )
	rm -f bin/amatl/linux/amatl
	mv tmp/amatl bin/amatl/linux/amatl

	curl -kL --output tmp/amatl.tar.gz https://github.com/Bornholm/amatl/releases/download/v$(AMATL_VERSION)/amatl_$(AMATL_VERSION)_windows_amd64.tar.gz
	( cd tmp && tar -xzf amatl.tar.gz )
	rm -f bin/amatl/win/amatl.exe
	mv tmp/amatl.exe bin/amatl/win/amatl.exe

	rm -rf tmp

publishvscode:
	vsce publish

publishvscodium:
	ovsx publish