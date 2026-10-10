import createDOMPurify from 'dompurify';

export const sanitizeDiagram = (svg: string) => {
  const purifier = createDOMPurify(window);
  purifier.addHook('uponSanitizeAttribute', (_node, attribute) => {
    if (attribute.attrName === 'style' && /url\s*\(|@import|expression\s*\(/i.test(attribute.attrValue)) attribute.keepAttr = false;
  });
  return purifier.sanitize(svg, {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['style', 'a', 'foreignObject', 'image', 'use', 'animate', 'set', 'animateTransform'],
  FORBID_ATTR: ['href', 'xlink:href'],
  });
};
