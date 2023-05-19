COMPILE_DEPENDENCIES = project.ts chips.ts webpack.config.js

# run: compile
# 	@node project.js;

compile: $(COMPILE_DEPENDENCIES)
	@tsc -p tsconfig.json;
	@npx webpack;
	


run_project:
	@node ../build/project.js;


run_chips:
	@node ../build/chips.js;


install:
	@echo "Install Dependencies";


push: .gitignore
	@git add . ;
	@git commit -m "update app";
	@git push;

