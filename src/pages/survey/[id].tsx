import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import get from 'lodash.get';

import { useRouter, NextRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';

import SurveyNotes from '~/components/SurveyNotes';
import SurveyComment from '~/components/SurveyComment';
import SurveySubmit from '~/components/SurveySubmit';

import { renderTemplate } from '~/util/renderTemplate';
import {
  withLayout,
  LayoutProps,
  getServerSidePropsFn,
} from '~/layouts/NPSSurveyLayout';

export const ctxSurveyIdGetter = (ctx: GetServerSidePropsContext): string =>
  ctx.params.id as string;

export const getServerSideProps = getServerSidePropsFn({
  ctxSurveyIdGetter,
  surveyExtraData: { concluded: false },
});

interface SubmitData {
  surveyId: string;
  note: string;
  comment: string;
}

export type OpenNpsEvents = ReturnType<typeof useEvents>;
export const createSubmit = (
  data: SubmitData,
  router: NextRouter,
  events: OpenNpsEvents
) => async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();
  events.OpenNpsSubmit(data);
  const response = await fetch(
    `${window.location.origin}/api/survey/conclude`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  const { ok } = await response.json();

  if (ok) {
    events.OpenNpsSuccess(data);
    router.push(`/survey/thanks?surveyId=${data.surveyId}`);
  }
};

const checkAndPostMessage = (shouldInvoke: boolean, title: string, data: Any) =>
  shouldInvoke &&
  window.parent.postMessage(
    JSON.stringify({ isOpenNps: true, title, data }),
    '*'
  );

export const useEvents = (shouldInvoke: boolean): AnyObject => ({
  OpenNpsChangeNote: ({ note }: SubmitData) =>
    checkAndPostMessage(shouldInvoke, 'OpenNpsChangeNote', note),
  OpenNpsChangeComment: ({ comment }: SubmitData) =>
    checkAndPostMessage(shouldInvoke, 'OpenNpsChangeComment', comment),
  OpenNpsSubmit: (data: SubmitData) =>
    checkAndPostMessage(shouldInvoke, 'OpenNpsSubmit', data),
  OpenNpsSuccess: (data: SubmitData) =>
    checkAndPostMessage(shouldInvoke, 'OpenNpsSuccess', data),
  OpenNpsLoad: (data: { reviewer: AnyObject; target: AnyObject }) =>
    checkAndPostMessage(shouldInvoke, 'OpenNpsLoad', data),
});

export const setValueForFieldInState = (
  state: AnyObject,
  setState: SimpleFn<AnyObject, void>
) => (field: string, mod: SimpleFn<AnyObject, void>) => (
  value: string
): void => {
  const newState = { ...state, [field]: value };
  setState(newState);
  mod(newState);
};

export const SurveyPage: React.FC<LayoutProps> = ({
  themeOpts,
  templates,
  data,
  surveyId,
  layoutClasses,
  isIframe,
}): React.ReactElement => {
  const [state, setState] = useState({ note: null, comment: '' });
  const router = useRouter();
  const events = useEvents(process.browser && isIframe);
  const onSubmit = createSubmit({ surveyId, ...state }, router, events);
  const setValueForField = setValueForFieldInState(state, setState);

  React.useEffect(() => {
    window.onload = function () {
      events.OpenNpsLoad(data);
    };
  });

  return (
    <form className={layoutClasses.root} onSubmit={onSubmit}>
      {themeOpts.SurveyTopBrandImage && (
        <div
          style={{
            maxWidth: get(themeOpts, 'SurveyTopBrandImage.width', 'auto'),
          }}
          className={layoutClasses.brand}
        >
          <img
            alt={themeOpts.SurveyTopBrandImage.alt}
            src={themeOpts.SurveyTopBrandImage.url}
          />
        </div>
      )}
      <Typography
        className={layoutClasses.corePhrase}
        data-cy="SurveyPageTypography"
        variant="h4"
        component="h4"
      >
        {renderTemplate(templates.CoreQuestionPhrase, data)}
      </Typography>
      <SurveyNotes
        themeOpts={themeOpts}
        setValue={setValueForField('note', events.OpenNpsChangeNote)}
        selected={state.note}
      />
      {templates.SurveyCommentText && (
        <Typography
          className={layoutClasses.commentPhrase}
          variant="h4"
          component="h4"
        >
          {renderTemplate(templates.SurveyCommentText, data)}
        </Typography>
      )}
      <SurveyComment
        value={state.comment}
        setValue={setValueForField('comment', events.OpenNpsChangeComment)}
        label={templates.SurveyCommentLabel}
        placeholder={templates.SurveyCommentPlaceholder}
      />
      <SurveySubmit themeOpts={themeOpts}>
        {templates.SendButtonMessage}
      </SurveySubmit>
    </form>
  );
};

export default withLayout(SurveyPage);
