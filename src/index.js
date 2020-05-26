module.exports = function(schema, option) {
    const { _, prettier } = option;

    // template
    const template = [];

    // imports
    const imports = [];

    // Global Public Functions
    const utils = [];

    // data
    const datas = [];

    const constants = {};

    // methods
    const methods = [];

    const expressionName = [];

    // lifeCycles
    const lifeCycles = [];

    // styles
    //const styles = [];

    // inline style
    const style = {};

    //const styles4vw = [];

    // box relative style
    const boxStyleList = ['fontSize', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'height', 'top', 'bottom', 'width', 'maxWidth', 'left', 'right', 'paddingRight', 'paddingLeft', 'marginLeft', 'marginRight', 'lineHeight', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'borderTopRightRadius', 'borderTopLeftRadius', 'borderRadius'];

    // no unit style
    const noUnitStyles = ['opacity', 'fontWeight'];

    const lifeCycleMap = {
        '_constructor': 'created',
        'getDerivedStateFromProps': 'beforeUpdate',
        'render': '',
        'componentDidMount': 'mounted',
        'componentDidUpdate': 'updated',
        'componentWillUnmount': 'beforeDestroy'
    }

    const width = option.responsive.width || 750;
    const viewportWidth = option.responsive.viewportWidth || 375;


    // 1vw = width / 100
    const _w = (width / 100);

    // 1rem = width / 7.5
    const _rem = (width / 7.5);

    const _ratio = width / viewportWidth;

    const isExpression = (value) => {
        return /^\{\{.*\}\}$/.test(value);
    }

    const transformEventName = (name) => {
        return name.replace('on', '').toLowerCase();
    }

    const toString = (value) => {
        if ({}.toString.call(value) === '[object Function]') {
            return value.toString();
        }
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, (key, value) => {
                if (typeof value === 'function') {
                    return value.toString();
                } else {
                    return value;
                }
            })
        }

        return String(value);
    };

    // flexDirection -> flex-direction
    const parseCamelToLine = (string) => {
        return string.split(/(?=[A-Z])/).join('-').toLowerCase();
    }

    // className structure support
    const generateLess = (schema, style) => {
        let less = '';

        function walk(json) {
            if (json.props.className) {
                let className = json.props.className;
                less += `.${className} {`;

                for (let key in style[className]) {
                    less += `${parseCamelToLine(key)}: ${style[className][key]};\n`
                }
            }

            if (json.children && json.children.length > 0) {
                json.children.forEach(child => walk(child));
            }

            if (json.props.className) {
                less += '}';
            }
        }

        walk(schema);

        return less;
    };

    // convert to responsive unit, such as vw
    const parseStyle = (styles) => {
        for (let style in styles) {
            for (let key in styles[style]) {
                switch (key) {
                    case 'fontSize':
                    case 'marginTop':
                    case 'marginBottom':
                    case 'paddingTop':
                    case 'paddingBottom':
                    case 'height':
                    case 'top':
                    case 'bottom':
                    case 'width':
                    case 'maxWidth':
                    case 'left':
                    case 'right':
                    case 'paddingRight':
                    case 'paddingLeft':
                    case 'marginLeft':
                    case 'marginRight':
                    case 'lineHeight':
                    case 'borderBottomRightRadius':
                    case 'borderBottomLeftRadius':
                    case 'borderTopRightRadius':
                    case 'borderTopLeftRadius':
                    case 'borderRadius':
                        styles[style][key] = (parseInt(styles[style][key]) / _w).toFixed(2) + 'vw';
                        break;
                }
            }
        }

        return styles;
    }

    // convert to responsive unit, such as rem
    const parseStyleRem = (styles) => {
        for (let style in styles) {
            for (let key in styles[style]) {
                switch (key) {
                    case 'fontSize':
                    case 'marginTop':
                    case 'marginBottom':
                    case 'paddingTop':
                    case 'paddingBottom':
                    case 'height':
                    case 'top':
                    case 'bottom':
                    case 'width':
                    case 'maxWidth':
                    case 'left':
                    case 'right':
                    case 'paddingRight':
                    case 'paddingLeft':
                    case 'marginLeft':
                    case 'marginRight':
                    case 'lineHeight':
                    case 'borderBottomRightRadius':
                    case 'borderBottomLeftRadius':
                    case 'borderTopRightRadius':
                    case 'borderTopLeftRadius':
                    case 'borderRadius':
                        styles[style][key] = (parseInt(styles[style][key]) / _rem).toFixed(2) + 'rem';
                        break;
                }
            }
        }

        return styles;
    }

    // parse function, return params and content
    const parseFunction = (func) => {
        const funcString = func.toString();
        const name = funcString.slice(funcString.indexOf('function'), funcString.indexOf('(')).replace('function ', '');
        const params = funcString.match(/\([^\(\)]*\)/)[0].slice(1, -1);
        const content = funcString.slice(funcString.indexOf('{') + 1, funcString.lastIndexOf('}'));
        return {
            params,
            content,
            name
        };
    }

    // parse layer props(static values or expression)
    const parseProps = (value, isReactNode, constantName) => {
        if (typeof value === 'string') {
            if (isExpression(value)) {
                if (isReactNode) {
                    return `{{${value.slice(7, -2)}}}`;
                } else {
                    return value.slice(2, -2);
                }
            }

            if (isReactNode) {
                return value;
            } else if (constantName) { // save to constant
                expressionName[constantName] = expressionName[constantName] ? expressionName[constantName] + 1 : 1;
                const name = `${constantName}${expressionName[constantName]}`;
                constants[name] = value;
                return `"constants.${name}"`;
            } else {
                return `"${value}"`;
            }
        } else if (typeof value === 'function') {
            const { params, content, name } = parseFunction(value);
            expressionName[name] = expressionName[name] ? expressionName[name] + 1 : 1;
            methods.push(`${name}_${expressionName[name]}(${params}) {${content}}`);
            return `${name}_${expressionName[name]}`;
        } else {
            return `${value}`;
        }
    }

    const parsePropsKey = (key, value) => {
        if (typeof value === 'function') {
            return `@${transformEventName(key)}`;
        } else {
            return `:${key}`;
        }
    }

    // parse async dataSource
    const parseDataSource = (data) => {
        const name = data.id;
        const { uri, method, params } = data.options;
        const action = data.type;
        let payload = {};

        switch (action) {
            case 'fetch':
                if (imports.indexOf(`import {fetch} from whatwg-fetch`) === -1) {
                    imports.push(`import {fetch} from 'whatwg-fetch'`);
                }
                payload = {
                    method: method
                };

                break;
            case 'jsonp':
                if (imports.indexOf(`import {fetchJsonp} from fetch-jsonp`) === -1) {
                    imports.push(`import jsonp from 'fetch-jsonp'`);
                }
                break;
        }

        Object.keys(data.options).forEach((key) => {
            if (['uri', 'method', 'params'].indexOf(key) === -1) {
                payload[key] = toString(data.options[key]);
            }
        });

        // params parse should in string template
        if (params) {
            payload = `${toString(payload).slice(0, -1)} ,body: ${isExpression(params) ? parseProps(params) : toString(params)}}`;
        } else {
            payload = toString(payload);
        }

        let result = `{
      ${action}(${parseProps(uri)}, ${toString(payload)})
        .then((response) => response.json())
    `;

        if (data.dataHandler) {
            const { params, content } = parseFunction(data.dataHandler);
            result += `.then((${params}) => {${content}})
        .catch((e) => {
          console.log('error', e);
        })
      `
        }

        result += '}';

        return `${name}() ${result}`;
    }

    // parse condition: whether render the layer
    const parseCondition = (condition, render) => {
        let _condition = isExpression(condition) ? condition.slice(2, -2) : condition;
        if (typeof _condition === 'string') {
            _condition = _condition.replace('this.', '');
        }
        render = render.replace(/^<\w+\s/, `${render.match(/^<\w+\s/)[0]} v-if="${_condition}" `);
        return render;
    }

    // parse loop render
    const parseLoop = (loop, loopArg, render) => {
        let data;
        let loopArgItem = (loopArg && loopArg[0]) || 'item';
        let loopArgIndex = (loopArg && loopArg[1]) || 'index';

        if (Array.isArray(loop)) {
            data = 'loopData';
            datas.push(`${data}: ${toString(loop)}`);
        } else if (isExpression(loop)) {
            data = loop.slice(2, -2).replace('this.state.', '');
        }
        // add loop key
        const tagEnd = render.indexOf('>');
        const keyProp = render.slice(0, tagEnd).indexOf('key=') == -1 ? `:key="${loopArgIndex}"` : '';
        render = `
      ${render.slice(0, tagEnd)}
      v-for="(${loopArgItem}, ${loopArgIndex}) in ${data}"  
      ${keyProp}
      ${render.slice(tagEnd)}`;

        // remove `this` 
        const re = new RegExp(`this.${loopArgItem}`, 'g')
        render = render.replace(re, loopArgItem);

        return render;
    }

    // generate render xml
    const generateRender = (schema) => {
        const type = schema.componentName.toLowerCase();
        const className = schema.props && schema.props.className;
        const classString = className ? ` class="${className}"` : '';

        if (className) {
            style[className] = schema.props.style;
        }

        let xml;
        let props = '';

        Object.keys(schema.props).forEach((key) => {
            if (['className', 'style', 'text', 'src'].indexOf(key) === -1) {
                props += ` ${parsePropsKey(key, schema.props[key])}="${parseProps(schema.props[key])}"`;
            }
        })

        switch (type) {
            case 'text':
                const innerText = parseProps(schema.props.text, true);
                xml = `<span${classString}${props}>${innerText}</span> `;
                break;
            case 'image':
                let source = parseProps(schema.props.src, false);
                if (!source.match('"')) {
                    source = `"${source}"`;
                    xml = `<img${classString}${props} :src=${source} /> `;
                } else {
                    xml = `<img${classString}${props} src=${source} /> `;
                }
                break;
            case 'div':
            case 'page':
            case 'block':
            case 'component':
                if (schema.children && schema.children.length) {
                    xml = `<div${classString}${props}>${transform(schema.children)}</div>`;
                } else {
                    xml = `<div${classString}${props} />`;
                }
                break;
        }

        if (schema.loop) {
            xml = parseLoop(schema.loop, schema.loopArgs, xml)
        }
        if (schema.condition) {
            xml = parseCondition(schema.condition, xml);
            // console.log(xml);
        }

        return xml || '';
    }

    // parse schema
    const transform = (schema) => {
        let result = '';

        if (Array.isArray(schema)) {
            schema.forEach((layer) => {
                result += transform(layer);
            });
        } else {
            const type = schema.componentName.toLowerCase();

            if (['page', 'block', 'component'].indexOf(type) !== -1) {
                // 容器组件处理: state/method/dataSource/lifeCycle/render
                const init = [];

                if (schema.state) {
                    datas.push(`${toString(schema.state).slice(1, -1)}`);
                }

                if (schema.methods) {
                    Object.keys(schema.methods).forEach((name) => {
                        const { params, content } = parseFunction(schema.methods[name]);
                        methods.push(`${name}(${params}) {${content}}`);
                    });
                }

                if (schema.dataSource && Array.isArray(schema.dataSource.list)) {
                    schema.dataSource.list.forEach((item) => {
                        if (typeof item.isInit === 'boolean' && item.isInit) {
                            init.push(`this.${item.id}();`)
                        } else if (typeof item.isInit === 'string') {
                            init.push(`if (${parseProps(item.isInit)}) { this.${item.id}(); }`)
                        }
                        methods.push(parseDataSource(item));
                    });

                    if (schema.dataSource.dataHandler) {
                        const { params, content } = parseFunction(schema.dataSource.dataHandler);
                        methods.push(`dataHandler(${params}) {${content}}`);
                        init.push(`this.dataHandler()`);
                    }
                }

                if (schema.lifeCycles) {
                    if (!schema.lifeCycles['_constructor']) {
                        lifeCycles.push(`${lifeCycleMap['_constructor']}() { ${init.join('\n')}}`);
                    }

                    Object.keys(schema.lifeCycles).forEach((name) => {
                        const vueLifeCircleName = lifeCycleMap[name] || name;
                        const { params, content } = parseFunction(schema.lifeCycles[name]);

                        if (name === '_constructor') {
                            lifeCycles.push(`${vueLifeCircleName}() {${content} ${init.join('\n')}}`);
                        } else {
                            lifeCycles.push(`${vueLifeCircleName}() {${content}}`);
                        }
                    });
                }

                template.push(generateRender(schema));

            } else {
                result += generateRender(schema);
            }
        }

        return result;
    };

    if (option.utils) {
        Object.keys(option.utils).forEach((name) => {
            utils.push(`const ${name} = ${option.utils[name]}`);
        });
    }

    // start parse schema
    transform(schema);
    datas.push(`constants: ${toString(constants)}`);

    const prettierOpt = {
        parser: 'vue',
        printWidth: 80,
        singleQuote: true
    };

    return {
        panelDisplay: [{
                panelName: `index.vue`,
                panelValue: prettier.format(`
          <template>
              <div class="imgcook-container"> 
              ${template}
              </div>
          </template>
          <script>
            ${imports.join('\n')}
            export default {
              data() {
                return {
                  ${datas.join(',\n')}
                } 
              },
              methods: {
                ${methods.join(',\n')}
              },
              ${lifeCycles.join(',\n')}
            }
          </script>
          <style src="./style.less" lang="less" scoped/>
        `, prettierOpt),
                panelType: 'vue',
            },
            // {
            //     panelName: 'index.css',
            //     panelValue: prettier.format(`${styles.join('\n')}`, { parser: 'css' }),
            //     panelType: 'css'
            // },
            {
                panelName: `style.less`,
                panelValue: prettier.format(generateLess(schema, parseStyle(style)), { parser: 'less' }),
                panelType: 'less'
            },
            // {
            //     panelName: 'index.response.css',
            //     panelValue: prettier.format(styles4vw.join('\n'), { parser: 'css' }),
            //     panelType: 'css'
            // }
        ],
        renderData: {
            template: template,
            imports: imports,
            datas: datas,
            methods: methods,
            lifeCycles: lifeCycles,
            style: style
        },
        noTemplate: true
    };
}