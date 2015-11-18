<header id="login-header">
  <div class="row">
    <div class="column">
      <a href="<?php print render($front_page); ?>" class="responsive-svg-container">
        <svg class="responsive-svg top-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 680.2 119.5"><use xlink:href="#logo"/></svg>
      </a>
    </div>
  </div>
</header>
<main id="login-body">
  <div class="row">
    <div class="medium-6 small-centered columns">
      <div class="text-center">
        <h1><?php print $title; ?></h1>
      </div>
    </div>
  </div> 
  <div class="row">
    <div class="medium-6 small-centered columns login-form-box-wrapper">
      <form class="login-form-box text-center" action="<?php print $base_path; ?>user/login" method="post" id="user-login" accept-charset="UTF-8">
        <div class="row">
          <div class="column">
            <?php print $messages; ?>
          </div>
          <div class="column">
            <input type="text" id="edit-name--2" name="name" value="" size="60" maxlength="60" class="form-text required" placeholder="<?php print t('Username'); ?>">
          </div>
          <div class="column">
            <input type="password" id="edit-pass--2" name="pass" size="60" maxlength="128" class="form-text required" placeholder="<?php print t('Password'); ?>">
            <input type="hidden" name="form_id" value="user_login">
          </div>
          <div class="column submit-area text-right">
            <?php print l(t('Forgot your password?'), 'user/password'); ?>
            <button type="submit" id="edit-submit" name="op"><svg class="icon icon-lock"><use xlink:href="#icon-lock"></use></svg>&nbsp;<?php print t('Log In'); ?></button>
          </div>
        </div>
      </form>
    </div>
  </div>
</main>
<footer id="login-footer">
  <div class="row">
    <div class="column">
      <p class="copyright">
      <?php if ($page['copyright']): ?>
        <?php print render($page['copyright']); ?>
      <?php endif; ?>
      </p>
      <nav>
        <a href="<?php print render($front_page); ?>"><svg class="icon icon-home"><use xlink:href="#icon-home"></use></svg>&nbsp;<?php print t('Home'); ?></a>
      </nav>
    </div>
  </div>
</footer>