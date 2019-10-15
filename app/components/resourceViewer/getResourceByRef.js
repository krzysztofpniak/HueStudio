const getResourceByRef = (hueData, ref) => {
  if (ref === '/config/localtime') {
    return { ref: '/config/localtime', name: '/config/localtime' };
  }

  if (ref === '/groups/0') {
    return { ref: '/groups/0', name: 'All lights' };
  }

  const [, type, id] = ref.split('/');
  return hueData[type][id];
};

export default getResourceByRef;
